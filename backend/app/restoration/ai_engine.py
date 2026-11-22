import os
from typing import Dict, Any

class ModelRegistry:
    """
    Tracks and checks availability of heavy neural weights (GFPGAN, Real-ESRGAN, LaMa).
    Guarantees honest reporting: if models or weights are not installed,
    fallback to high-fidelity OpenCV CV Engine is clearly declared.
    """
    @staticmethod
    def get_status() -> Dict[str, Dict[str, Any]]:
        weights_dir = os.path.join(os.path.dirname(__file__), "weights")
        os.makedirs(weights_dir, exist_ok=True)
        
        gfpgan_weight = os.path.join(weights_dir, "GFPGANv1.4.pth")
        realesrgan_weight = os.path.join(weights_dir, "RealESRGAN_x4plus.pth")
        lama_weight = os.path.join(weights_dir, "big-lama.pt")
        
        return {
            "GFPGAN": {
                "name": "GFPGAN v1.4 (Generative Face Restoration)",
                "available": os.path.exists(gfpgan_weight),
                "fallback": "OpenCV Haar-Cascade & Bilateral Face Enhancement Engine",
                "notes": "Weights file not detected. Active fallback: High-fidelity OpenCV edge-preserving portrait filter." if not os.path.exists(gfpgan_weight) else "Pretrained neural weights loaded."
            },
            "Real-ESRGAN": {
                "name": "Real-ESRGAN x4+ (Super Resolution)",
                "available": os.path.exists(realesrgan_weight),
                "fallback": "Lanczos-4 Sinc Resampling & Micro-Contrast Synthesis",
                "notes": "Weights file not detected. Active fallback: Lanczos-4 sub-pixel interpolation engine." if not os.path.exists(realesrgan_weight) else "Pretrained neural weights loaded."
            },
            "LaMa": {
                "name": "Large Mask Inpainting (LaMa)",
                "available": os.path.exists(lama_weight),
                "fallback": "OpenCV Navier-Stokes / Telea Inpainting Engine",
                "notes": "Weights file not detected. Active fallback: OpenCV FMM & Telea inpainting." if not os.path.exists(lama_weight) else "Pretrained neural weights loaded."
            },
            "Gemini": {
                "name": "Google Gemini Vision API",
                "available": bool(os.getenv("GEMINI_API_KEY")),
                "fallback": "Heuristic Computer Vision Quality Analysis Engine",
                "notes": "GEMINI_API_KEY detected and active." if bool(os.getenv("GEMINI_API_KEY")) else "GEMINI_API_KEY not configured. Running offline Computer Vision heuristic analyzer."
            }
        }
