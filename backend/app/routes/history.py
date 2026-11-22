import os
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import Optional, List

from app.database.session import get_db
from app.models.document import Document
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.config import settings
from app.services.export_service import generate_pdf_report

router = APIRouter(prefix="/api", tags=["Document History & Retrieval"])

@router.get("/history")
def get_document_history(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves document history with search, status filtering, and pagination.
    Restricted to documents owned by the authenticated user (or legacy unassigned demonstration records).
    """
    query = db.query(Document).filter(
        or_(Document.user_id == current_user.id, Document.user_id.is_(None))
    )
    
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))
    if status and status != "ALL":
        query = query.filter(Document.status == status)
        
    total_count = query.count()
    documents = query.order_by(desc(Document.created_at)).offset(offset).limit(limit).all()
    
    doc_dicts = []
    for d in documents:
        item = d.to_dict()
        item["original_url"] = f"/api/files/upload/{d.stored_filename}"
        item["restored_url"] = f"/api/files/processed/{d.restored_filename}" if d.restored_filename else None
        item["report_url"] = f"/api/report/{d.id}/pdf" if d.restored_filename else None
        doc_dicts.append(item)
        
    return {
        "total": total_count,
        "offset": offset,
        "limit": limit,
        "items": doc_dicts
    }

@router.get("/history/{doc_id}")
def get_document_detail(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves single document metadata. Verifies caller ownership."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    if doc.user_id and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to view this document."
        )
        
    item = doc.to_dict()
    item["original_url"] = f"/api/files/upload/{doc.stored_filename}"
    item["restored_url"] = f"/api/files/processed/{doc.restored_filename}" if doc.restored_filename else None
    item["report_url"] = f"/api/report/{doc.id}/pdf" if doc.restored_filename else None
    return item

@router.delete("/history/{doc_id}")
def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently erases document metadata and disk assets. Verifies caller ownership."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    if doc.user_id and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to delete this document."
        )
        
    # Remove files safely
    orig_path = settings.UPLOADS_DIR / doc.stored_filename
    if orig_path.exists():
        try:
            os.remove(orig_path)
        except Exception:
            pass
            
    if doc.restored_filename:
        restored_path = settings.PROCESSED_DIR / doc.restored_filename
        if restored_path.exists():
            try:
                os.remove(restored_path)
            except Exception:
                pass
                
    pdf_path = settings.REPORTS_DIR / f"{doc.id}_report.pdf"
    if pdf_path.exists():
        try:
            os.remove(pdf_path)
        except Exception:
            pass
            
    db.delete(doc)
    db.commit()
    return {"status": "success", "message": f"Document {doc_id} permanently erased."}

@router.post("/history/bulk-delete")
def bulk_delete_documents(
    doc_ids: List[str] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes multiple documents in bulk. Restricts deletions to records owned by caller."""
    deleted_count = 0
    for doc_id in doc_ids:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc and (doc.user_id is None or doc.user_id == current_user.id):
            orig_path = settings.UPLOADS_DIR / doc.stored_filename
            if orig_path.exists():
                try: os.remove(orig_path)
                except Exception: pass
            if doc.restored_filename:
                restored_path = settings.PROCESSED_DIR / doc.restored_filename
                if restored_path.exists():
                    try: os.remove(restored_path)
                    except Exception: pass
            pdf_path = settings.REPORTS_DIR / f"{doc.id}_report.pdf"
            if pdf_path.exists():
                try: os.remove(pdf_path)
                except Exception: pass
            db.delete(doc)
            deleted_count += 1
            
    db.commit()
    return {"status": "success", "deleted_count": deleted_count}

@router.get("/download/{doc_id}")
def download_restored_document(
    doc_id: str,
    version: str = "restored",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Secure asset download. Enforces authentication and record ownership."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    if doc.user_id and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to download this asset."
        )
        
    if version == "original":
        target_path = settings.UPLOADS_DIR / doc.stored_filename
        download_name = f"ORIGINAL_{doc.original_filename}"
    else:
        if not doc.restored_filename:
            raise HTTPException(status_code=400, detail="Restored version not available yet.")
        target_path = settings.PROCESSED_DIR / doc.restored_filename
        download_name = f"RESTORED_{doc.original_filename}"
        
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Requested file asset is missing from storage.")
        
    return FileResponse(
        path=str(target_path),
        filename=download_name,
        media_type=doc.mime_type
    )

@router.get("/report/{doc_id}/pdf")
def get_pdf_report(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates and serves audit trail PDF certificate. Enforces caller authorization."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    if doc.user_id and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to access this audit report."
        )
        
    pdf_filename = generate_pdf_report(doc)
    pdf_path = settings.REPORTS_DIR / pdf_filename
    
    return FileResponse(
        path=str(pdf_path),
        filename=f"Audit_Report_{doc.original_filename.split('.')[0]}.pdf",
        media_type="application/pdf"
    )
