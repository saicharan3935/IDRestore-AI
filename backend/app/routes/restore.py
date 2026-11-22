import json
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.models.document import Document
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.image_processor import validate_and_save_upload, execute_restoration_pipeline
from app.gemini_service import analyze_document_image
from app.schemas.restoration import RestorationOptions
from app.config import settings

router = APIRouter(prefix="/api", tags=["Restoration"])

@router.post("/restore")
async def restore_document(
    file: Optional[UploadFile] = File(None),
    document_id: Optional[str] = Form(None),
    options: Optional[str] = Form(None),  # JSON string of RestorationOptions
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes the restoration pipeline on a document.
    Can accept either a new file upload or an existing document_id.
    Protected endpoint: Enforces user ownership and authorization.
    """
    parsed_options = RestorationOptions()
    if options:
        try:
            options_dict = json.loads(options)
            parsed_options = RestorationOptions(**options_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid restoration options JSON: {str(e)}")

    doc = None
    if file:
        file_bytes = await file.read()
        try:
            doc_id, stored_filename, w, h = validate_and_save_upload(file_bytes, file.filename)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
            
        doc = Document(
            id=doc_id,
            user_id=current_user.id,
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_size_bytes=len(file_bytes),
            mime_type=file.content_type or "image/jpeg",
            width=w,
            height=h,
            status="RESTORING"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Also run quick analysis if not present
        try:
            analysis = await analyze_document_image(str(settings.UPLOADS_DIR / stored_filename))
            doc.gemini_analysis = analysis.model_dump()
        except Exception:
            pass
            
    elif document_id:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        # User ownership verification
        if doc.user_id and doc.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not have permission to restore this document."
            )
        if not doc.user_id:
            doc.user_id = current_user.id
        doc.status = "RESTORING"
        db.commit()
    else:
        raise HTTPException(status_code=400, detail="Either 'file' or 'document_id' must be provided.")

    try:
        pipeline_result = execute_restoration_pipeline(
            doc_id=doc.id,
            original_stored_filename=doc.stored_filename,
            options=parsed_options
        )
        
        doc.restored_filename = pipeline_result["restored_filename"]
        doc.restored_width = pipeline_result["restored_width"]
        doc.restored_height = pipeline_result["restored_height"]
        doc.status = pipeline_result["status"]
        doc.operations_applied = pipeline_result["operations_executed"]
        doc.ai_models_used = pipeline_result["ai_models_used"]
        doc.metrics = pipeline_result["metrics"]
        doc.integrity_warnings = pipeline_result["integrity_warnings"]
        
        db.commit()
        db.refresh(doc)
        
        return {
            "document_id": doc.id,
            "original_filename": doc.original_filename,
            "status": doc.status,
            "operations_executed": doc.operations_applied,
            "ai_models_used": doc.ai_models_used,
            "metrics": doc.metrics,
            "integrity_warnings": doc.integrity_warnings,
            "original_image_url": f"/api/files/upload/{doc.stored_filename}",
            "restored_image_url": f"/api/files/processed/{doc.restored_filename}",
            "report_url": f"/api/report/{doc.id}/pdf",
            "document": doc.to_dict()
        }
        
    except Exception as e:
        doc.status = "FAILED"
        doc.integrity_warnings = [f"Restoration failure: {str(e)}"]
        db.commit()
        raise HTTPException(status_code=500, detail=f"Restoration processing error: {str(e)}")
