import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.models.document import Document
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.image_processor import validate_and_save_upload
from app.gemini_service import analyze_document_image
from app.config import settings

router = APIRouter(prefix="/api", tags=["Analysis"])

@router.post("/analyze")
async def analyze_document(
    file: Optional[UploadFile] = File(None),
    document_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyzes an uploaded document or previously uploaded document.
    Runs Gemini AI image analysis or local OpenCV CV heuristic analysis.
    Protected endpoint: Enforces user ownership and authorization.
    """
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
            status="ANALYZING"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
    elif document_id:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        # User ownership verification
        if doc.user_id and doc.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not have permission to view or process this document."
            )
        if not doc.user_id:
            doc.user_id = current_user.id
            db.commit()
    else:
        raise HTTPException(status_code=400, detail="Either 'file' or 'document_id' must be provided.")

    file_path = str(settings.UPLOADS_DIR / doc.stored_filename)
    
    # Run Gemini AI analysis (or CV fallback)
    analysis_result = await analyze_document_image(file_path)
    
    doc.gemini_analysis = analysis_result.model_dump()
    doc.status = "PENDING"
    db.commit()
    db.refresh(doc)
    
    return {
        "document_id": doc.id,
        "filename": doc.original_filename,
        "width": doc.width,
        "height": doc.height,
        "file_size_bytes": doc.file_size_bytes,
        "analysis": doc.gemini_analysis,
        "original_url": f"/api/files/upload/{doc.stored_filename}"
    }
