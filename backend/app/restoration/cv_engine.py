import cv2
import numpy as np
from typing import Tuple, Optional, List

def denoise_image(img_bgr: np.ndarray, strength: str = "medium") -> np.ndarray:
    """
    Edge-preserving noise reduction.
    Uses Bilateral filtering for document text preservation without blurring glyph edges.
    """
    if strength == "high":
        # Bilateral filter with larger sigma for heavy grain
        return cv2.bilateralFilter(img_bgr, d=9, sigmaColor=75, sigmaSpace=75)
    elif strength == "low":
        return cv2.bilateralFilter(img_bgr, d=5, sigmaColor=30, sigmaSpace=30)
    else:
        # Default medium
        return cv2.bilateralFilter(img_bgr, d=7, sigmaColor=50, sigmaSpace=50)

def enhance_contrast(img_bgr: np.ndarray, clip_limit: float = 2.0, tile_grid_size: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space
    to improve faded ink contrast without altering color balance.
    """
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_clahe = clahe.apply(l)
    
    merged = cv2.merge((l_clahe, a, b))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)

def correct_brightness(img_bgr: np.ndarray, gamma: Optional[float] = None) -> np.ndarray:
    """
    Adaptive luminance correction using non-linear gamma curve.
    Dark documents get brightened; overexposed documents get balanced.
    """
    if gamma is None:
        # Auto-compute gamma based on mean luminance
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        mean_lum = np.mean(gray)
        if mean_lum < 80:
            gamma = 1.4  # Dark image, brighten
        elif mean_lum > 190:
            gamma = 0.8  # Washed out image, deepen contrast
        else:
            gamma = 1.05  # Slight boost
            
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    return cv2.LUT(img_bgr, table)

def sharpen_image(img_bgr: np.ndarray, amount: float = 1.25, threshold: int = 3) -> np.ndarray:
    """
    Gaussian unsharp masking with thresholding to enhance glyph edges without boosting noise.
    """
    blurred = cv2.GaussianBlur(img_bgr, (0, 0), sigmaX=1.5)
    diff = cv2.subtract(img_bgr, blurred)
    
    # Mask out subtle differences under threshold (pure noise)
    mask = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY) > threshold
    mask_3d = np.repeat(mask[:, :, np.newaxis], 3, axis=2)
    
    sharpened = cv2.addWeighted(img_bgr, 1.0 + amount, blurred, -amount, 0)
    result = np.where(mask_3d, sharpened, img_bgr)
    return np.clip(result, 0, 255).astype(np.uint8)

def color_correction(img_bgr: np.ndarray) -> np.ndarray:
    """
    Applies Gray-World White Balance algorithm to remove yellowing/aging color casts from document paper.
    """
    result = img_bgr.copy().astype(np.float32)
    avg_b = np.mean(result[:, :, 0])
    avg_g = np.mean(result[:, :, 1])
    avg_r = np.mean(result[:, :, 2])
    avg_all = (avg_b + avg_g + avg_r) / 3.0
    
    if avg_b > 0 and avg_g > 0 and avg_r > 0:
        result[:, :, 0] = np.clip(result[:, :, 0] * (avg_all / avg_b), 0, 255)
        result[:, :, 1] = np.clip(result[:, :, 1] * (avg_all / avg_g), 0, 255)
        result[:, :, 2] = np.clip(result[:, :, 2] * (avg_all / avg_r), 0, 255)
        
    return result.astype(np.uint8)

def document_cleanup(img_bgr: np.ndarray) -> np.ndarray:
    """
    Homogenizes uneven paper lighting, removing stains, coffee rings, and shadows
    by estimating background illumination and dividing it out.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Estimate background with wide morphological opening
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
    background = cv2.morphologyEx(gray, cv2.MORPH_DILATE, kernel)
    background = cv2.GaussianBlur(background, (21, 21), 0)
    
    # Normalize image against estimated background
    normalized = cv2.divide(gray, background, scale=255)
    
    # Blend back slightly with color channels
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    hsv[:, :, 2] = cv2.addWeighted(hsv[:, :, 2], 0.25, normalized, 0.75, 0)
    
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

def upscale_image(img_bgr: np.ndarray, scale_factor: int = 2) -> np.ndarray:
    """
    Super-resolution upscaling using high-order Lanczos interpolation
    followed by detail recovery.
    """
    h, w = img_bgr.shape[:2]
    new_w, new_h = w * scale_factor, h * scale_factor
    upscaled = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    # Refine subtle micro-contrast
    return sharpen_image(upscaled, amount=0.4, threshold=2)

def face_restoration_filter(img_bgr: np.ndarray) -> Tuple[np.ndarray, bool, List[str]]:
    """
    Performs portrait face region enhancement: detects face bounding boxes,
    restores eye/nose/mouth micro-contrast, and gently smooths facial skin artifacts.
    Returns (enhanced_img, face_detected, warnings).
    """
    warnings = [
        "Portrait face detail enhancement applied. Filtering and sharpness synthesis may alter biometric fidelity; do not use as legal identity authentication."
    ]
    face_found = False
    result = img_bgr.copy()
    
    if hasattr(cv2, "CascadeClassifier") and hasattr(cv2, "data"):
        try:
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(face_cascade_path)
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
            if len(faces) > 0:
                face_found = True
                for (x, y, w, h) in faces:
                    pad = int(0.1 * min(w, h))
                    x1, y1 = max(0, x - pad), max(0, y - pad)
                    x2, y2 = min(img_bgr.shape[1], x + w + pad), min(img_bgr.shape[0], y + h + pad)
                    roi = result[y1:y2, x1:x2]
                    smooth_roi = cv2.bilateralFilter(roi, d=5, sigmaColor=40, sigmaSpace=40)
                    sharpened_roi = sharpen_image(smooth_roi, amount=0.6, threshold=2)
                    result[y1:y2, x1:x2] = sharpened_roi
        except Exception:
            pass
            
    if not face_found:
        # High quality detail enhancement for portrait document
        smooth = cv2.bilateralFilter(result, d=5, sigmaColor=35, sigmaSpace=35)
        result = sharpen_image(smooth, amount=0.45, threshold=2)
        
    return result, face_found, warnings
