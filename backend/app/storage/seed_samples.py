import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from app.config import settings
from app.database.session import SessionLocal
from app.models.document import Document
from app.image_processor import execute_restoration_pipeline
from app.schemas.restoration import RestorationOptions

def create_synthetic_fictional_document():
    """
    Creates a synthetic, strictly fictional 1980s employee identification card:
    'NEXUS AEROSPACE &bull; EMPLOYEE VERIFICATION CERTIFICATE'.
    Generates both an original clean version, an artificially degraded version
    (yellowing, scratches, blur, grain, fading), and then runs it through restoration.
    """
    w, h = 900, 600
    # Clean document canvas with off-white paper
    img = np.full((h, w, 3), (242, 246, 248), dtype=np.uint8)
    
    # Draw certificate borders
    cv2.rectangle(img, (25, 25), (w - 25, h - 25), (60, 70, 80), 2)
    cv2.rectangle(img, (32, 32), (w - 32, h - 32), (180, 190, 200), 1)
    
    # Organization Header
    cv2.putText(img, "GLOBAL DYNAMICS CORP - PERSONNEL DIVISION", (50, 75), cv2.FONT_HERSHEY_DUPLEX, 0.75, (30, 40, 50), 2)
    cv2.putText(img, "OFFICIAL EMPLOYEE ARCHIVAL RECORD (1987)", (50, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 115, 125), 1)
    cv2.line(img, (50, 120), (w - 50, 120), (100, 120, 140), 2)
    
    # Employee synthetic portrait box
    cv2.rectangle(img, (60, 150), (220, 350), (140, 150, 160), 2)
    # Draw simple synthetic portrait silhouette
    cv2.circle(img, (140, 220), 45, (160, 175, 190), -1)
    cv2.ellipse(img, (140, 330), (70, 60), 0, 180, 360, (130, 145, 160), -1)
    cv2.putText(img, "PHOTO ID", (105, 380), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 130, 140), 1)
    
    # Details Fields
    fields = [
        ("EMPLOYEE ID:", "GDC-87402-ENG"),
        ("FULL NAME:", "JONATHAN R. MERCER"),
        ("DEPARTMENT:", "ADVANCED PROPULSION SYSTEMS"),
        ("CLEARANCE:", "LEVEL-IV RESTRICTED ARCHIVE"),
        ("HIRE DATE:", "OCTOBER 14, 1987"),
        ("ISSUING AUTH:", "DIRECTOR OF HRMS INFRASTRUCTURE"),
        ("DOCUMENT STATUS:", "HISTORICAL RECORD - MIGRATION CANDIDATE")
    ]
    
    y = 175
    for label, val in fields:
        cv2.putText(img, label, (260, y), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (80, 90, 100), 1)
        cv2.putText(img, val, (430, y), cv2.FONT_HERSHEY_DUPLEX, 0.56, (20, 30, 40), 1)
        cv2.line(img, (260, y + 10), (w - 60, y + 10), (220, 225, 230), 1)
        y += 40
        
    # Security Seal / Stamp
    cv2.circle(img, (750, 480), 65, (70, 80, 160), 2)
    cv2.circle(img, (750, 480), 55, (70, 80, 160), 1)
    cv2.putText(img, "HRMS VERIFIED", (695, 475), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (70, 80, 160), 1)
    cv2.putText(img, "ARCHIVE 1987", (705, 495), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (70, 80, 160), 1)
    
    # Verification Barcode Simulation
    for bx in range(60, 400, 4):
        thickness = 1 if (bx % 3 == 0) else 2
        cv2.line(img, (bx, 500), (bx, 545), (40, 50, 60), thickness)
    cv2.putText(img, "* GDC-87402-ENG-SEC *", (140, 565), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (60, 70, 80), 1)
    
    # NOW CREATE THE DEGRADED ARTIFACT
    degraded = img.copy().astype(np.float32)
    
    # 1. Aging / Yellowing paper cast
    degraded[:, :, 0] *= 0.65  # reduce blue channel heavily
    degraded[:, :, 1] *= 0.82  # reduce green slightly
    degraded[:, :, 2] *= 0.95  # keep red (gives sepia/yellow cast)
    
    # 2. Uneven lighting gradient / vignette
    h_idx, w_idx = np.indices((h, w))
    vignette = 1.0 - 0.45 * (((w_idx - w/2)/(w/2))**2 + ((h_idx - h/2)/(h/2))**2)
    vignette = np.clip(vignette, 0.5, 1.0)
    for c in range(3):
        degraded[:, :, c] *= vignette
        
    # 3. Simulate coffee stain / water damage ring
    stain_center = (620, 240)
    cv2.circle(degraded, stain_center, 90, (110, 140, 170), -1) # darker brown
    cv2.circle(degraded, stain_center, 75, (160, 190, 215), -1) # slightly lighter center
    
    # 4. Blur / Optical defocus
    degraded = cv2.GaussianBlur(degraded, (5, 5), 1.8)
    
    # 5. Sensor grain / noise
    noise = np.random.normal(0, 14, degraded.shape).astype(np.float32)
    degraded = np.clip(degraded + noise, 0, 255).astype(np.uint8)
    
    # 6. Faint scratches
    cv2.line(degraded, (100, 50), (450, 520), (140, 160, 170), 1)
    cv2.line(degraded, (400, 20), (750, 480), (130, 150, 160), 1)
    
    return img, degraded

def ensure_synthetic_sample_documents():
    """Generates synthetic sample documents if not already present."""
    db = SessionLocal()
    try:
        sample_doc_id = "sample-emp-record-1987"
        existing = db.query(Document).filter(Document.id == sample_doc_id).first()
        if existing:
            return
            
        clean_img, degraded_img = create_synthetic_fictional_document()
        
        stored_filename = f"{sample_doc_id}_orig.jpg"
        orig_path = settings.UPLOADS_DIR / stored_filename
        cv2.imwrite(str(orig_path), degraded_img)
        
        # Save clean ground truth / demonstration sample
        sample_demo_orig = settings.SAMPLES_DIR / "demo_original_degraded.jpg"
        cv2.imwrite(str(sample_demo_orig), degraded_img)
        
        doc = Document(
            id=sample_doc_id,
            original_filename="Personnel_Record_Mercer_1987.jpg",
            stored_filename=stored_filename,
            file_size_bytes=int(os.path.getsize(orig_path)),
            mime_type="image/jpeg",
            width=900,
            height=600,
            status="PENDING",
            gemini_analysis={
                "image_quality": {
                    "rating": "poor",
                    "assessment": "Severe archival degradation with uneven illumination, sepia yellowing, optical defocus, and fluid stain.",
                    "confidence": 0.92
                },
                "detected_issues": [
                    {"issue": "blur", "severity": "high", "description": "Microtext font glyphs have lost sharpness due to 1.8px defocus."},
                    {"issue": "yellowing", "severity": "high", "description": "Blue channel attenuation indicative of acid-paper aging."},
                    {"issue": "uneven_lighting", "severity": "medium", "description": "Perimeter luminance vignetting."},
                    {"issue": "noise", "severity": "medium", "description": "Gaussian grain noise sigma ~14.0."},
                    {"issue": "scratches", "severity": "low", "description": "Linear emulsion surface abrasions."}
                ],
                "recommended_operations": [
                    "denoising", "contrast_enhancement", "color_correction", "document_cleanup", "sharpening"
                ],
                "document_readability": "partially_readable",
                "face_visibility": "degraded",
                "restoration_notes": ["Archival paper restoration routine initiated."],
                "confidence_or_uncertainty": ["Original text characters remain structurally identifiable."],
                "ai_provider": "IDRestore AI Seed Engine"
            }
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Now execute real restoration
        options = RestorationOptions(
            automatic_enhancement=False,
            denoise=True,
            contrast_enhancement=True,
            brightness_correction=True,
            sharpening=True,
            color_correction=True,
            face_restoration=False,
            upscale=False,
            document_cleanup=True
        )
        
        res = execute_restoration_pipeline(sample_doc_id, stored_filename, options)
        doc.restored_filename = res["restored_filename"]
        doc.restored_width = res["restored_width"]
        doc.restored_height = res["restored_height"]
        doc.status = res["status"]
        doc.operations_applied = res["operations_executed"]
        doc.ai_models_used = res["ai_models_used"]
        doc.metrics = res["metrics"]
        doc.integrity_warnings = res["integrity_warnings"]
        db.commit()
        
        # Also copy restored to samples for frontend showcase
        sample_demo_restored = settings.SAMPLES_DIR / "demo_restored_clean.jpg"
        restored_src = settings.PROCESSED_DIR / res["restored_filename"]
        if restored_src.exists():
            import shutil
            shutil.copy(str(restored_src), str(sample_demo_restored))
            
    finally:
        db.close()
