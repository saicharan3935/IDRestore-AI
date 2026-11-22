# IDRESTORE AI — OBSIDIAN FUTURISM EDITION
### Enterprise Generative AI Document Restoration Platform for HRMS Migration

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-00E5FF.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-00FFA3.svg?style=flat&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-DCE7EC.svg?style=flat&logo=three.js)](https://threejs.org)
[![OpenCV](https://img.shields.io/badge/OpenCV-Headless-00E5FF.svg?style=flat&logo=opencv)](https://opencv.org)
[![Google Gen AI](https://img.shields.io/badge/Google_GenAI-Gemini_2.5-00FFA3.svg?style=flat&logo=google)](https://ai.google.dev)
[![Argon2id](https://img.shields.io/badge/Security-Argon2id-00E5FF.svg?style=flat)](#)
[![License](https://img.shields.io/badge/License-Enterprise-101820.svg)](#)

---

## 1. Executive Summary

**IDRestore AI** is an intelligent employee document restoration platform designed specifically for enterprise Human Resources departments executing legacy archive migrations into modern Cloud HRMS platforms (Workday, SAP SuccessFactors, Oracle Cloud HCM).

Decades of historical paper documents, badges, personnel cards, and certificates suffer from optical defocus, acidic paper yellowing, uneven flash vignetting, fluid spills, and film grain. IDRestore AI couples **Google Gemini Multimodal Vision Intelligence** for automated damage diagnostic profiling with an **OpenCV deterministic image reconstruction pipeline** to restore microtext legibility without altering historical fidelity.

---

## 2. Absolute Design Identity — Obsidian Futurism

In strict adherence to design requirements, **IDRestore AI contains ZERO purple, violet, lavender, or magenta gradients.**

Inspired by Apple industrial design, premium aerospace cockpits, black chrome technology products, and advanced AI research facilities, the user experience utilizes:

| Color Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Main Background** | `#050709` | Deep obsidian vacuum black canvas |
| **Secondary Background** | `#0B1117` | Structural framework & containers |
| **Panel Background** | `#101820` | Frosted glass panels & navigation surfaces |
| **Elevated Surface** | `#17232C` | Active interactive cards & hover surfaces |
| **Electric Cyan** | `#00E5FF` | Primary accent, lasers, highlights, HUD reticles |
| **Laser Mint** | `#00FFA3` | Confirmed successful operations, verified metrics |
| **Platinum Silver** | `#DCE7EC` | High-contrast technical typography |
| **Primary Text** | `#F8FAFC` | Crisp legible headers & body content |
| **Secondary Text** | `#94A3B8` | Subtext, timestamps, and metadata |
| **Warning Amber** | `#FFB547` | Attention flags & manual review advisories |
| **Error Red** | `#FF5C5C` | Rejections & critical validation warnings |

---

## 3. Full-Page Cinematic 3D Scroll Journey

The application features a full-page persistent **React Three Fiber / Three.js** WebGL background canvas that fluidly evolves across the entire landing page scroll journey:

```
[ Hero: Chrome AI Sphere ] 
        ↓ (Scroll)
[ Stage 2: Rough Metallic Asteroid with Cyan Glowing Fissures ] 
        ↓ (Scroll)
[ Stage 3: Asteroid Descent & Cosmic Particle Trail ] 
        ↓ (Scroll)
[ Stage 4: Surface Dispersal & Holographic Neural Network Core ] 
        ↓ (Scroll)
[ Stage 5: Distant Cosmic Horizon & Calm Atmospheric Ambiance ]
```

- **Seamless Reverse Scrolling**: Scrolling upward reverses the 3D transformations smoothly with mathematical damping (`MathUtils.lerp`).
- **Normalized Pointer Parallax**: Captures mouse coordinates at the page level and applies subtle depth parallax to the camera and 3D objects without blocking clicks, buttons, or form controls.
- **Hardware Optimization**: Device Pixel Ratio is intelligently capped (`dpr={[1, 1.5]}`) with pre-allocated geometries to guarantee 60 FPS performance on standard laptops.
- **Accessibility & Fallback**: Full support for `prefers-reduced-motion` and automatic WebGL fallback.

---

## 4. Enterprise Security & Authentication System

Access to all private workspaces, image restoration pipelines, document history, and audit certificates is protected by a zero-trust authentication architecture:

1. **Password Security**: Passwords are hashed with **Argon2id** (memory-hard, resistant to GPU/ASIC cracking).
2. **Session Architecture**:
   - `HttpOnly` session cookies (`idrestore_session`) prevent XSS session theft.
   - Separate `idrestore_csrf` cookie paired with `X-CSRF-Token` header verification on state-changing requests (`POST`, `PUT`, `DELETE`).
   - `SameSite=Lax` and configurable HTTPS `Secure` flags.
3. **Cross-User Authorization**:
   - Every document record and batch job is bound to its owner (`user_id`).
   - Backend APIs strictly enforce ownership checks: Users can never access, download, or delete another user's documents merely by guessing or changing an ID (returns `403 Forbidden`).
4. **Brute-Force Rate Limiting**:
   - Sliding-window in-memory IP rate limiter limits login and registration attempts to prevent brute-force attacks.
5. **Session Persistence**:
   - On page refresh, the React client automatically verifies the server session (`GET /api/auth/me`), seamlessly restoring the authenticated user's workspace without relying on insecure `localStorage` tokens.

### Local Evaluation Account Seed

To seed a local demonstration account for evaluator testing:
```powershell
cd C:\Users\Bhavana\.gemini\antigravity\scratch\IDRestore-AI\backend
.\venv\Scripts\python.exe -m app.auth.seed_demo_user
```
- **Email**: `analyst@idrestore.ai`
- **Password**: `ObsidianRestore2026!`
- **Role**: `HR_ADMIN`

*(A one-click "Quick-Fill Demo Credentials" button is also provided directly on the Sign In page for rapid reviewer evaluation!)*

---

## 5. Core Technology Stack

### Backend Engine
- **FastAPI**: Asynchronous REST API framework
- **OpenCV (Headless 5.1.0)**: Bilateral denoise, CLAHE, adaptive gamma, unsharp masking, gray-world balance, Lanczos-4 upscaling
- **Argon2-cffi**: Enterprise-grade password hashing
- **SQLAlchemy & SQLite**: Relational database with automatic migration
- **Google Gen AI SDK (`google-genai`)**: Multimodal damage diagnostic analysis with local CV heuristic fallback
- **ReportLab**: PDF Technical Audit Certificate generation

### Frontend Studio
- **React 18 & Vite 5**: Ultra-fast component rendering and production bundling
- **Three.js & React Three Fiber**: Full-page cinematic 3D scroll environment
- **Tailwind CSS**: Strict Obsidian Futurism design tokens
- **Framer Motion**: Smooth interface transitions and scanning animations
- **Lucide React**: Clean technical iconography

---

## 6. How to Launch the Application

### Option 1: Unified Server (FastAPI serves API + SPA together)

```powershell
cd C:\Users\Bhavana\.gemini\antigravity\scratch\IDRestore-AI\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open **`http://localhost:8000`** in your browser.

### Option 2: Frontend Vite Development Server

```powershell
# In a separate terminal:
cd C:\Users\Bhavana\.gemini\antigravity\scratch\IDRestore-AI\frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 7. Running Automated Test Suites

```powershell
cd C:\Users\Bhavana\.gemini\antigravity\scratch\IDRestore-AI\backend
.\venv\Scripts\python.exe -m pytest tests/ -v
```

All 12 automated test suites execute and pass:
- `test_health_endpoint` PASSED
- `test_dashboard_stats` PASSED
- `test_models_registry` PASSED
- `test_settings_endpoint` PASSED
- `test_analyze_and_restore_workflow` PASSED
- `test_bulk_delete_endpoint` PASSED
- `test_batch_creation_and_manifest` PASSED
- `test_invalid_file_extension` PASSED
- `test_unauthorized_endpoints` PASSED
- `test_registration_and_login_flow` PASSED
- `test_cross_user_document_authorization` PASSED
- `test_complete_end_to_end_workflow` PASSED

---

## 8. Security & Ethical Disclaimer

- **Zero Biometric Claims**: IDRestore AI enhances visual document contrast and legibility for HRMS migration; it does NOT verify or certify photographic identity.
- **Retention & Privacy**: Sensitive records are stored under unique UUIDs with directory traversal guards.
