import os
import json
import logging
import asyncio
from typing import Dict, Any, Optional
from PIL import Image
import numpy as np
import cv2

from app.schemas.gemini import GeminiAnalysisResult, ImageQualityAssessment, DetectedIssue
from app.restoration.metrics import calculate_sharpness, calculate_contrast, calculate_brightness, estimate_noise

logger = logging.getLogger("idrestore.gemini")

def analyze_with_cv_heuristics(img_path: str) -> GeminiAnalysisResult:
    """
    Offline Computer Vision fallback analyzer.
    Runs when GEMINI_API_KEY is not configured or when API quota is reached.
    Accurately computes metrics using OpenCV and outputs valid schema.
    """
    img_bgr = cv2.imread(img_path)
    if img_bgr is None:
        raise ValueError("Could not read image file for CV analysis")
        
    sharpness = calculate_sharpness(img_bgr)
    contrast = calculate_contrast(img_bgr)
    brightness = calculate_brightness(img_bgr)
    noise = estimate_noise(img_bgr)
    
    issues = []
    recommended = []
    
    # Evaluate sharpness / blur
    if sharpness < 100:
        issues.append(DetectedIssue(
            issue="blur",
            severity="high" if sharpness < 50 else "medium",
            description=f"Deficient edge sharpness (Laplacian variance: {sharpness:.1f}). Text boundaries may be softened."
        ))
        recommended.append("sharpening")
    
    # Evaluate noise
    if noise > 12.0:
        issues.append(DetectedIssue(
            issue="noise",
            severity="high" if noise > 20.0 else "medium",
            description=f"Noticeable high-frequency sensor or film grain (Noise index: {noise:.1f})."
        ))
        recommended.append("denoising")
        
    # Evaluate contrast
    if contrast < 45.0:
        issues.append(DetectedIssue(
            issue="fading",
            severity="high" if contrast < 30.0 else "medium",
            description=f"Degraded tonal contrast (RMS contrast: {contrast:.1f}). Ink appears faded against background."
        ))
        recommended.append("contrast_enhancement")
        
    # Evaluate brightness / illumination
    if brightness < 90 or brightness > 200:
        issues.append(DetectedIssue(
            issue="uneven_lighting",
            severity="medium",
            description=f"Suboptimal illumination (Mean luminance: {brightness:.1f}/255)."
        ))
        recommended.append("brightness_correction")
        
    # Check for color degradation / paper aging
    b, g, r = cv2.split(img_bgr)
    color_diff = abs(float(r.mean()) - float(b.mean()))
    if color_diff > 25:
        issues.append(DetectedIssue(
            issue="yellowing",
            severity="medium",
            description="Chromatic shift indicative of archival paper aging or temperature distortion."
        ))
        recommended.append("color_correction")
        recommended.append("document_cleanup")
        
    if not recommended:
        recommended = ["contrast_enhancement", "sharpening"]
        rating = "good"
        assessment = "Document structure is intact with moderate micro-contrast degradation."
        confidence = 0.88
    elif len(issues) >= 3:
        rating = "poor"
        assessment = "Multi-factor degradation observed including blur, noise, and tonal fading."
        confidence = 0.82
    else:
        rating = "fair"
        assessment = "Moderate document degradation detected requiring tonal restoration."
        confidence = 0.85

    # Check for face presence if CascadeClassifier is available
    face_visibility = "not_present"
    if hasattr(cv2, "CascadeClassifier") and hasattr(cv2, "data"):
        try:
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(face_cascade_path)
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
            if len(faces) > 0:
                face_visibility = "degraded"
                recommended.append("face_restoration")
        except Exception:
            pass

    return GeminiAnalysisResult(
        image_quality=ImageQualityAssessment(
            rating=rating,
            assessment=assessment,
            confidence=confidence
        ),
        detected_issues=issues,
        recommended_operations=list(dict.fromkeys(recommended)),
        document_readability="medium" if rating in ["fair", "good"] else "partially_readable",
        face_visibility=face_visibility,
        restoration_notes=[
            "Analysis executed via internal OpenCV Computer Vision Engine (Offline Mode).",
            "Metrics computed via Laplacian variance and Donoho wavelet residual estimation.",
            "Pixel enhancement performed locally via mathematical color transformations."
        ],
        confidence_or_uncertainty=[
            "Offline CV analysis provides deterministic signal evaluation but lacks semantic glyph comprehension.",
            "Connect Google Gemini API key in Settings for semantic multimodal damage evaluation."
        ],
        ai_provider="OpenCV Heuristic Vision Engine (Offline Mode)"
    )


async def analyze_document_image(img_path: str) -> GeminiAnalysisResult:
    """
    Analyzes an employee document image using the official Google Gen AI SDK.
    Falls back gracefully to OpenCV CV Engine if key is missing, invalid, or quota exceeded.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    
    if not api_key:
        logger.info("GEMINI_API_KEY is not set. Using offline OpenCV CV analyzer.")
        return analyze_with_cv_heuristics(img_path)

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        prompt = """
        You are an enterprise document restoration vision specialist analyzing degraded HR records.
        Carefully examine this document image and return a JSON object with this exact structure:
        {
          "image_quality": {
            "rating": "poor", // choose from: "excellent", "good", "fair", "poor", "critical"
            "assessment": "Detailed 1-2 sentence description of visual degradation",
            "confidence": 0.85 // float between 0.0 and 1.0
          },
          "detected_issues": [
            {
              "issue": "blur", // e.g. "blur", "noise", "fading", "scratches", "uneven_lighting", "yellowing"
              "severity": "high", // "low", "medium", "high", "critical"
              "description": "Specific visual observation"
            }
          ],
          "recommended_operations": [
            "denoising", "contrast_enhancement", "sharpening", "color_correction", "face_restoration", "document_cleanup", "upscale"
          ],
          "document_readability": "partially_readable", // "high", "medium", "partially_readable", "unreadable"
          "face_visibility": "degraded", // "clear", "degraded", "obscured", "not_present"
          "restoration_notes": ["Note 1", "Note 2"],
          "confidence_or_uncertainty": ["Uncertainty or limitation 1"]
        }

        STRICT SAFETY & ETHICAL RULES:
        - Never attempt to identify any person or read full social security/identity numbers.
        - Never fabricate or guess missing text or personal data.
        - Clearly state any optical ambiguities in 'confidence_or_uncertainty'.
        - Only return raw JSON without markdown formatting.
        """
        
        # Load image via PIL
        pil_img = Image.open(img_path)
        
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=[prompt, pil_img],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        raw_text = response.text.strip()
        # Clean potential markdown backticks
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()
        
        data = json.loads(raw_text)
        data["ai_provider"] = f"Google Gen AI ({os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')})"
        return GeminiAnalysisResult(**data)
        
    except Exception as e:
        logger.warning(f"Gemini API request failed ({str(e)}). Falling back to offline OpenCV analyzer.")
        fallback = analyze_with_cv_heuristics(img_path)
        fallback.restoration_notes.append(f"Gemini API invocation encountered: {str(e)[:100]}. Fallback applied.")
        fallback.confidence_or_uncertainty.append("Gemini live call fallback activated.")
        return fallback
