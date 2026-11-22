import os
import time
import uuid
import cv2
import numpy as np
from typing import Dict, Any, List, Tuple
from pathlib import Path

from app.config import settings
from app.restoration.cv_engine import (
    denoise_image,
    enhance_contrast,
    correct_brightness,
    sharpen_image,
    color_correction,
    document_cleanup,
    upscale_image,
    face_restoration_filter,
)
from app.restoration.metrics import (
    calculate_sharpness,
    calculate_contrast,
    calculate_brightness,
    estimate_noise,
    calculate_psnr,
    calculate_ssim,
)
from app.schemas.restoration import RestorationOptions

def validate_and_save_upload(file_bytes: bytes, filename: str) -> Tuple[str, str, int, int]:
    """
    Validates file format, size, and image integrity.
    Saves to secure upload storage with a random UUID.
    Returns (doc_id, stored_filename, width, height).
    """
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file extension '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}")
        
    if len(file_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB.")
        
    # Decode bytes with OpenCV to verify decode integrity
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid or corrupted image file. OpenCV could not decode the byte stream.")
        
    h, w = img.shape[:2]
    if w > settings.MAX_IMAGE_DIMENSION or h > settings.MAX_IMAGE_DIMENSION:
        raise ValueError(f"Image dimension ({w}x{h}) exceeds maximum allowable dimension of {settings.MAX_IMAGE_DIMENSION}px.")
        
    doc_id = str(uuid.uuid4())
    stored_filename = f"{doc_id}_orig.{ext}"
    dest_path = settings.UPLOADS_DIR / stored_filename
    
    with open(dest_path, "wb") as f:
        f.write(file_bytes)
        
    return doc_id, stored_filename, w, h


def execute_restoration_pipeline(
    doc_id: str,
    original_stored_filename: str,
    options: RestorationOptions
) -> Dict[str, Any]:
    """
    Executes the image restoration pipeline sequentially.
    Tracks executed operations, computes before/after metrics,
    enforces safety warnings, and writes restored output.
    """
    orig_path = settings.UPLOADS_DIR / original_stored_filename
    if not orig_path.exists():
        raise FileNotFoundError(f"Original image {original_stored_filename} not found.")
        
    img = cv2.imread(str(orig_path))
    if img is None:
        raise ValueError("Failed to load original image for restoration.")
        
    start_time = time.perf_counter()
    h_orig, w_orig = img.shape[:2]
    
    # Pre-restoration measurements
    sharpness_before = calculate_sharpness(img)
    contrast_before = calculate_contrast(img)
    brightness_before = calculate_brightness(img)
    noise_before = estimate_noise(img)
    
    operations_executed: List[str] = []
    ai_models_used: List[str] = ["IDRestore OpenCV Image Engine"]
    integrity_warnings: List[str] = [
        "DISCLAIMER: This restored image is an algorithmic enhancement for legibility during HR migration and does NOT constitute certified legal identity verification."
    ]
    
    current_img = img.copy()
    
    # 1. Denoising
    if options.automatic_enhancement or options.denoise:
        current_img = denoise_image(current_img, strength="medium")
        operations_executed.append("Bilateral Edge-Preserving Denoising")
        ai_models_used.append("Adaptive Bilateral Filter")
        
    # 2. Contrast Enhancement
    if options.automatic_enhancement or options.contrast_enhancement:
        current_img = enhance_contrast(current_img, clip_limit=2.2)
        operations_executed.append("LAB CLAHE Contrast Normalization")
        ai_models_used.append("CLAHE Dynamic Range Restorer")
        
    # 3. Brightness Correction
    if options.automatic_enhancement or options.brightness_correction:
        current_img = correct_brightness(current_img)
        operations_executed.append("Non-Linear Gamma Luminance Correction")
        
    # 4. Face Restoration
    if options.face_restoration:
        current_img, face_found, face_warnings = face_restoration_filter(current_img)
        operations_executed.append("Portrait Detail & Contouring Enhancement")
        ai_models_used.append("Haar Cascade & Biometric Detail Filter")
        integrity_warnings.extend(face_warnings)
        
    # 5. Color Correction
    if options.automatic_enhancement or options.color_correction:
        current_img = color_correction(current_img)
        operations_executed.append("Gray-World Chromaticity Balance")
        
    # 6. Document Cleanup (stain/shadow removal)
    if options.document_cleanup:
        current_img = document_cleanup(current_img)
        operations_executed.append("Morphological Background Illumination Homogenization")
        ai_models_used.append("Morphological Structuring Field Restorer")
        
    # 7. Sharpening
    if options.automatic_enhancement or options.sharpening:
        current_img = sharpen_image(current_img, amount=1.2, threshold=3)
        operations_executed.append("Gaussian Unsharp Masking")
        
    # 8. Super-resolution / Upscaling
    if options.upscale:
        scale = min(options.scale_factor, 4)
        current_img = upscale_image(current_img, scale_factor=scale)
        operations_executed.append(f"Lanczos-4 High-Resolution Upscale ({scale}x)")
        ai_models_used.append(f"Lanczos-4 Sinc Kernel Resampler ({scale}x)")
        
    h_restored, w_restored = current_img.shape[:2]
    
    # Post-restoration measurements
    sharpness_after = calculate_sharpness(current_img)
    contrast_after = calculate_contrast(current_img)
    brightness_after = calculate_brightness(current_img)
    noise_after = estimate_noise(current_img)
    
    # Calculate gain percentages
    sharpness_gain = 0.0
    if sharpness_before > 0:
        sharpness_gain = round(((sharpness_after - sharpness_before) / sharpness_before) * 100, 1)
        
    psnr_val = calculate_psnr(img, current_img)
    ssim_val = calculate_ssim(img, current_img)
    
    # Save restored image
    ext = original_stored_filename.split(".")[-1]
    restored_filename = f"{doc_id}_restored.{ext}"
    dest_path = settings.PROCESSED_DIR / restored_filename
    cv2.imwrite(str(dest_path), current_img)
    
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    
    # Check if review should be flagged
    status = "COMPLETED"
    if sharpness_after > sharpness_before * 4.0:
        integrity_warnings.append("High sharpness gradient detected. Verify that glyph edges have not introduced ringing artifacts.")
        status = "REQUIRES_REVIEW"
        
    metrics_data = {
        "sharpness_before": sharpness_before,
        "sharpness_after": sharpness_after,
        "sharpness_gain_percent": sharpness_gain,
        "contrast_before": contrast_before,
        "contrast_after": contrast_after,
        "brightness_before": brightness_before,
        "brightness_after": brightness_after,
        "noise_before": noise_before,
        "noise_after": noise_after,
        "psnr_db": psnr_val,
        "ssim": ssim_val,
        "processing_time_ms": duration_ms,
        "resolution_before": f"{w_orig}x{h_orig}",
        "resolution_after": f"{w_restored}x{h_restored}"
    }
    
    return {
        "restored_filename": restored_filename,
        "restored_width": w_restored,
        "restored_height": h_restored,
        "status": status,
        "operations_executed": operations_executed,
        "ai_models_used": list(dict.fromkeys(ai_models_used)),
        "metrics": metrics_data,
        "integrity_warnings": integrity_warnings,
        "duration_ms": duration_ms
    }
