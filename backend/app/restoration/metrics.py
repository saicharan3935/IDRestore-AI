import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional

def calculate_sharpness(img_bgr: np.ndarray) -> float:
    """Calculates image sharpness using the variance of the Laplacian."""
    if img_bgr is None or img_bgr.size == 0:
        return 0.0
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    variance = float(laplacian.var())
    return round(variance, 2)

def calculate_contrast(img_bgr: np.ndarray) -> float:
    """Calculates RMS (Root Mean Square) contrast of the luminance channel."""
    if img_bgr is None or img_bgr.size == 0:
        return 0.0
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
    rms = float(gray.std())
    return round(rms, 2)

def calculate_brightness(img_bgr: np.ndarray) -> float:
    """Calculates mean brightness (0-255)."""
    if img_bgr is None or img_bgr.size == 0:
        return 0.0
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
    mean_val = float(gray.mean())
    return round(mean_val, 2)

def estimate_noise(img_bgr: np.ndarray) -> float:
    """Estimates Gaussian noise standard deviation using Donoho's median absolute deviation estimator."""
    if img_bgr is None or img_bgr.size == 0:
        return 0.0
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
    H, W = gray.shape
    # High-pass filter kernel (Laplacian)
    kernel = np.array([[1, -2, 1], [-2, 4, -2], [1, -2, 1]], dtype=np.float32)
    filtered = cv2.filter2D(gray.astype(np.float32), -1, kernel)
    sigma = float(np.sum(np.abs(filtered)) * np.sqrt(0.5 * np.pi) / (6.0 * (W - 2) * (H - 2)))
    return round(sigma, 2)

def calculate_psnr(img1: np.ndarray, img2: np.ndarray) -> Optional[float]:
    """Calculates Peak Signal-to-Noise Ratio between two images."""
    try:
        # Resize img2 to img1 if dimensions differ for metric comparison
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]), interpolation=cv2.INTER_AREA)
        
        mse = np.mean((img1.astype(np.float64) - img2.astype(np.float64)) ** 2)
        if mse == 0:
            return 100.0  # Identical
        max_pixel = 255.0
        psnr = 20 * np.log10(max_pixel / np.sqrt(mse))
        return round(float(psnr), 2)
    except Exception:
        return None

def calculate_ssim(img1: np.ndarray, img2: np.ndarray) -> Optional[float]:
    """Calculates Structural Similarity Index (SSIM) between luminance channels."""
    try:
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]), interpolation=cv2.INTER_AREA)
        
        g1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY) if len(img1.shape) == 3 else img1
        g2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY) if len(img2.shape) == 3 else img2
        
        g1 = g1.astype(np.float64)
        g2 = g2.astype(np.float64)
        
        C1 = (0.01 * 255) ** 2
        C2 = (0.03 * 255) ** 2
        
        kernel = cv2.getGaussianKernel(11, 1.5)
        window = np.outer(kernel, kernel.transpose())
        
        mu1 = cv2.filter2D(g1, -1, window)[5:-5, 5:-5]
        mu2 = cv2.filter2D(g2, -1, window)[5:-5, 5:-5]
        
        mu1_sq = mu1 * mu1
        mu2_sq = mu2 * mu2
        mu1_mu2 = mu1 * mu2
        
        sigma1_sq = cv2.filter2D(g1 * g1, -1, window)[5:-5, 5:-5] - mu1_sq
        sigma2_sq = cv2.filter2D(g2 * g2, -1, window)[5:-5, 5:-5] - mu2_sq
        sigma12 = cv2.filter2D(g1 * g2, -1, window)[5:-5, 5:-5] - mu1_mu2
        
        ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
        return round(float(ssim_map.mean()), 4)
    except Exception:
        return None

def compute_quality_profile(img_bgr: np.ndarray) -> Dict[str, float]:
    """Computes all quality metrics for a single image."""
    return {
        "sharpness": calculate_sharpness(img_bgr),
        "contrast": calculate_contrast(img_bgr),
        "brightness": calculate_brightness(img_bgr),
        "noise_estimate": estimate_noise(img_bgr),
    }
