from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime, timedelta, timezone

from app.database.session import get_db
from app.models.document import Document
from app.models.batch_job import BatchJob
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["Dashboard"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "IDRestore AI Core Engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected",
        "version": "1.0.0"
    }

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Computes comprehensive statistics scoped to the authenticated user's workspace."""
    doc_filter = or_(Document.user_id == current_user.id, Document.user_id.is_(None))
    batch_filter = or_(BatchJob.user_id == current_user.id, BatchJob.user_id.is_(None))

    total_docs = db.query(Document).filter(doc_filter).count()
    completed = db.query(Document).filter(doc_filter, Document.status == "COMPLETED").count()
    review = db.query(Document).filter(doc_filter, Document.status == "REQUIRES_REVIEW").count()
    failed = db.query(Document).filter(doc_filter, Document.status == "FAILED").count()
    total_batches = db.query(BatchJob).filter(batch_filter).count()

    # Calculate average processing time and sharpness gain from completed records
    docs_with_metrics = db.query(Document).filter(
        doc_filter,
        Document.status.in_(["COMPLETED", "REQUIRES_REVIEW"])
    ).all()
    
    total_time = 0.0
    total_gain = 0.0
    valid_count = 0
    
    damage_counts = {
        "blur": 0,
        "noise": 0,
        "fading": 0,
        "scratches": 0,
        "uneven_lighting": 0,
        "yellowing": 0
    }
    
    operation_counts = {
        "Denoising": 0,
        "Contrast Enhancement": 0,
        "Brightness Correction": 0,
        "Sharpening": 0,
        "Color Correction": 0,
        "Document Cleanup": 0,
        "Face Restoration": 0,
        "Upscaling": 0
    }

    for d in docs_with_metrics:
        m = d.metrics or {}
        p_time = m.get("processing_time_ms", 0.0)
        s_gain = m.get("sharpness_gain_percent", 0.0)
        if p_time > 0:
            total_time += p_time
            total_gain += s_gain
            valid_count += 1
            
        g_analysis = d.gemini_analysis or {}
        for issue_obj in g_analysis.get("detected_issues", []):
            iss = issue_obj.get("issue", "").lower()
            if iss in damage_counts:
                damage_counts[iss] += 1
                
        for op in (d.operations_applied or []):
            for k in operation_counts.keys():
                if k.lower() in op.lower():
                    operation_counts[k] += 1

    avg_time = round(total_time / valid_count, 1) if valid_count > 0 else 0.0
    avg_gain = round(total_gain / valid_count, 1) if valid_count > 0 else 0.0

    # 7-day activity grouping
    now = datetime.now(timezone.utc)
    daily_activity = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_str = day_date.strftime("%a")
        start_day = datetime(day_date.year, day_date.month, day_date.day)
        end_day = start_day + timedelta(days=1)
        cnt = db.query(Document).filter(
            doc_filter,
            Document.created_at >= start_day,
            Document.created_at < end_day
        ).count()
        daily_activity.append({
            "day": day_str,
            "date": day_date.strftime("%b %d"),
            "processed": cnt
        })

    return {
        "stats": {
            "total_documents": total_docs,
            "successful_restorations": completed,
            "requiring_review": review,
            "failed_documents": failed,
            "total_batch_jobs": total_batches,
            "average_processing_time_ms": avg_time,
            "average_sharpness_gain_percent": avg_gain,
            "success_rate_percent": round((completed / total_docs * 100), 1) if total_docs > 0 else 100.0,
            "system_health": "operational",
            "is_demo_data": False
        },
        "charts": {
            "daily_activity": daily_activity,
            "damage_distribution": [{"name": k.replace("_", " ").title(), "count": v} for k, v in damage_counts.items()],
            "operation_frequency": [{"name": k, "count": v} for k, v in operation_counts.items()]
        }
    }

@router.get("/demo-sample")
def get_demo_sample(db: Session = Depends(get_db)):
    """Returns the synthetic demonstration document with full before/after URLs and metrics."""
    doc = db.query(Document).filter(Document.id == "sample-emp-record-1987").first()
    if not doc:
        doc = db.query(Document).filter(Document.status == "COMPLETED").first()
        
    if doc:
        item = doc.to_dict()
        item["original_url"] = f"/api/files/upload/{doc.stored_filename}"
        item["restored_url"] = f"/api/files/processed/{doc.restored_filename}"
        item["report_url"] = f"/api/report/{doc.id}/pdf"
        return item
        
    return {"message": "No sample currently generated"}
