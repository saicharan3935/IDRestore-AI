import uuid
import json
import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db, SessionLocal
from app.models.batch_job import BatchJob
from app.models.document import Document
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.image_processor import validate_and_save_upload, execute_restoration_pipeline
from app.gemini_service import analyze_document_image
from app.schemas.restoration import RestorationOptions
from app.services.export_service import export_migration_manifest_csv
from app.config import settings

router = APIRouter(prefix="/api", tags=["Batch Processing & HR Migration"])

async def process_batch_background(batch_id: str, doc_ids: List[str], options_dict: dict):
    """Processes batch items in background with bounded concurrency."""
    db = SessionLocal()
    try:
        batch = db.query(BatchJob).filter(BatchJob.id == batch_id).first()
        if not batch:
            return
            
        batch.status = "PROCESSING"
        db.commit()
        
        parsed_options = RestorationOptions(**options_dict)
        
        for doc_id in doc_ids:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if not doc:
                continue
                
            try:
                # 1. Quick analysis
                file_path = str(settings.UPLOADS_DIR / doc.stored_filename)
                analysis = await analyze_document_image(file_path)
                doc.gemini_analysis = analysis.model_dump()
                
                # 2. Pipeline restoration
                res = execute_restoration_pipeline(doc_id, doc.stored_filename, parsed_options)
                doc.restored_filename = res["restored_filename"]
                doc.restored_width = res["restored_width"]
                doc.restored_height = res["restored_height"]
                doc.status = res["status"]
                doc.operations_applied = res["operations_executed"]
                doc.ai_models_used = res["ai_models_used"]
                doc.metrics = res["metrics"]
                doc.integrity_warnings = res["integrity_warnings"]
                
                if doc.status == "COMPLETED":
                    batch.completed_items += 1
                elif doc.status == "REQUIRES_REVIEW":
                    batch.review_items += 1
                    
            except Exception as e:
                doc.status = "FAILED"
                doc.integrity_warnings = [f"Batch item failure: {str(e)}"]
                batch.failed_items += 1
                
            db.commit()
            
        batch.status = "COMPLETED"
        batch.completed_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()


@router.post("/batch")
async def create_batch_job(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    batch_name: Optional[str] = Form("HR_Migration_Batch"),
    options: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accepts multiple document uploads and schedules them for batch processing."""
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided in batch upload.")
        
    options_dict = {}
    if options:
        try:
            options_dict = json.loads(options)
        except Exception:
            pass
            
    batch_id = str(uuid.uuid4())
    batch = BatchJob(
        id=batch_id,
        user_id=current_user.id,
        name=batch_name,
        status="PENDING",
        total_items=len(files),
        completed_items=0,
        failed_items=0,
        review_items=0,
        options=options_dict
    )
    db.add(batch)
    
    doc_ids = []
    for f in files:
        file_bytes = await f.read()
        try:
            doc_id, stored_filename, w, h = validate_and_save_upload(file_bytes, f.filename)
            doc = Document(
                id=doc_id,
                user_id=current_user.id,
                original_filename=f.filename,
                stored_filename=stored_filename,
                file_size_bytes=len(file_bytes),
                mime_type=f.content_type or "image/jpeg",
                width=w,
                height=h,
                status="PENDING",
                batch_id=batch_id
            )
            db.add(doc)
            doc_ids.append(doc_id)
        except Exception:
            continue
            
    db.commit()
    db.refresh(batch)
    
    # Run in background tasks
    background_tasks.add_task(process_batch_background, batch_id, doc_ids, options_dict)
    
    return {
        "batch_id": batch.id,
        "name": batch.name,
        "total_items": len(doc_ids),
        "status": "PROCESSING",
        "message": f"Enqueued {len(doc_ids)} documents for background restoration."
    }

@router.get("/batch/{batch_id}")
def get_batch_status(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch = db.query(BatchJob).filter(BatchJob.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch job not found.")
        
    if batch.user_id and batch.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to view this batch."
        )
        
    documents = db.query(Document).filter(Document.batch_id == batch_id).all()
    doc_dicts = []
    for d in documents:
        item = d.to_dict()
        item["original_url"] = f"/api/files/upload/{d.stored_filename}"
        item["restored_url"] = f"/api/files/processed/{d.restored_filename}" if d.restored_filename else None
        doc_dicts.append(item)
        
    return {
        "batch": batch.to_dict(),
        "items": doc_dicts
    }

@router.get("/batch/{batch_id}/manifest")
def download_batch_manifest(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports a CSV migration manifest for documents belonging to this batch."""
    batch = db.query(BatchJob).filter(BatchJob.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch job not found.")
        
    if batch.user_id and batch.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to export this batch."
        )
        
    docs = db.query(Document).filter(Document.batch_id == batch_id).all()
    csv_content = export_migration_manifest_csv(docs)
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in batch.name)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=batch_manifest_{safe_name}_{batch.id[:8]}.csv"}
    )

@router.get("/migration/manifest")
def download_migration_manifest(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports a unified CSV migration manifest for all documents in the user's workspace."""
    docs = db.query(Document).filter(
        or_(Document.user_id == current_user.id, Document.user_id.is_(None))
    ).all()
    csv_content = export_migration_manifest_csv(docs)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=hrms_migration_manifest_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"}
    )
