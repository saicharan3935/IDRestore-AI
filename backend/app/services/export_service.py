import os
import json
import csv
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.config import settings
from app.models.document import Document

def generate_pdf_report(doc: Document) -> str:
    """
    Generates a PDF restoration certificate & technical audit report
    with Obsidian Futurism styling.
    """
    report_filename = f"{doc.id}_report.pdf"
    pdf_path = settings.REPORTS_DIR / report_filename
    
    # Document template
    pdf = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Obsidian Futurism Palette
    c_bg_dark = colors.HexColor("#050709")
    c_panel = colors.HexColor("#101820")
    c_cyan = colors.HexColor("#00E5FF")
    c_mint = colors.HexColor("#00FFA3")
    c_text_primary = colors.HexColor("#F8FAFC")
    c_text_muted = colors.HexColor("#94A3B8")
    c_border = colors.HexColor("#22323D")
    c_amber = colors.HexColor("#FFB547")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_cyan,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_text_muted,
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_mint,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1A202C")
    )
    
    small_disclaimer_style = ParagraphStyle(
        'DisclaimerDark',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#4A5568")
    )
    
    story = []
    
    # Header Banner
    story.append(Paragraph("IDRESTORE AI &bull; TECHNICAL AUDIT & RESTORATION REPORT", title_style))
    story.append(Paragraph(f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Document ID: {doc.id}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_cyan, spaceBefore=0, spaceAfter=15))
    
    # 1. Document Metadata Table
    story.append(Paragraph("DOCUMENT SPECIFICATIONS", section_style))
    meta_data = [
        ["Original Filename:", doc.original_filename, "Processing Status:", doc.status],
        ["Dimensions (Before):", f"{doc.width} x {doc.height} px", "Dimensions (After):", f"{doc.restored_width or doc.width} x {doc.restored_height or doc.height} px"],
        ["File Size:", f"{(doc.file_size_bytes / 1024):.1f} KB", "MIME Type:", doc.mime_type],
        ["Batch ID:", doc.batch_id or "Single Ingestion", "Engine Version:", "v1.0.0 (Obsidian Futurism)"]
    ]
    meta_table = Table(meta_data, colWidths=[110, 160, 120, 150])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor("#2D3748")),
        ('TEXTCOLOR', (2,0), (2,-1), colors.HexColor("#2D3748")),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    
    # 2. Gemini AI / Computer Vision Intelligence
    story.append(Paragraph("AI DAMAGE & QUALITY INTELLIGENCE", section_style))
    g_analysis = doc.gemini_analysis or {}
    q_rating = g_analysis.get("image_quality", {}).get("rating", "N/A").upper()
    q_assessment = g_analysis.get("image_quality", {}).get("assessment", "Baseline image scan performed.")
    q_conf = g_analysis.get("image_quality", {}).get("confidence", 0.0)
    readability = g_analysis.get("document_readability", "partially_readable").replace("_", " ").title()
    face_vis = g_analysis.get("face_visibility", "not_present").replace("_", " ").title()
    ai_provider = g_analysis.get("ai_provider", "IDRestore Engine")
    
    ai_summary_data = [
        ["Analyzer Engine:", ai_provider, "Quality Rating:", q_rating],
        ["Readability Score:", readability, "Confidence Level:", f"{(q_conf * 100):.1f}%" if q_conf else "N/A"],
        ["Portrait Visibility:", face_vis, "Visual Assessment:", q_assessment]
    ]
    ai_table = Table(ai_summary_data, colWidths=[110, 160, 120, 150])
    ai_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(ai_table)
    story.append(Spacer(1, 12))
    
    # 3. Restoration Quantitative Metrics
    story.append(Paragraph("QUANTITATIVE RESTORATION METRICS", section_style))
    metrics = doc.metrics or {}
    metrics_data = [
        ["Metric", "Pre-Restoration", "Post-Restoration", "Delta / Outcome"],
        ["Sharpness (Laplacian Var)", f"{metrics.get('sharpness_before', 0.0):.1f}", f"{metrics.get('sharpness_after', 0.0):.1f}", f"+{metrics.get('sharpness_gain_percent', 0.0):.1f}%"],
        ["RMS Tonal Contrast", f"{metrics.get('contrast_before', 0.0):.1f}", f"{metrics.get('contrast_after', 0.0):.1f}", "Dynamic Range Expanded"],
        ["Mean Luminance", f"{metrics.get('brightness_before', 0.0):.1f}/255", f"{metrics.get('brightness_after', 0.0):.1f}/255", "Histogram Balanced"],
        ["Noise Sigma Estimate", f"{metrics.get('noise_before', 0.0):.1f}", f"{metrics.get('noise_after', 0.0):.1f}", "High Frequency Denoised"],
        ["Processing Duration", f"{metrics.get('processing_time_ms', 0.0):.1f} ms", "SSIM Index", f"{metrics.get('ssim', 'N/A')}"]
    ]
    metrics_table = Table(metrics_data, colWidths=[160, 120, 120, 140])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 12))
    
    # 4. Executed Operations & Models
    story.append(Paragraph("EXECUTED ALGORITHMS & MODELS", section_style))
    ops = doc.operations_applied or ["Standard OpenCV Enhancement Pipeline"]
    ops_text = Paragraph(", ".join(ops), body_style)
    story.append(ops_text)
    story.append(Spacer(1, 10))
    
    # 5. Integrity Warnings & Compliance Disclaimers
    story.append(Paragraph("DATA INTEGRITY & HRMS COMPLIANCE", section_style))
    warnings = doc.integrity_warnings or ["No critical integrity hazards detected."]
    for w in warnings:
        story.append(Paragraph(f"&bull; {w}", small_disclaimer_style))
        story.append(Spacer(1, 2))
        
    story.append(Spacer(1, 10))
    disclaimer = (
        "IMPORTANT LEGAL NOTICE: IDRestore AI applies image enhancement algorithms solely to improve text legibility "
        "and visual readability during enterprise HRMS migration. This platform does not certify, notarize, or legally verify "
        "the authentic ownership or identity of the person depicted in this document. Any facial portrait reconstruction is algorithmic "
        "and should never be used as photographic truth in legal or biometric proceedings."
    )
    story.append(Paragraph(disclaimer, small_disclaimer_style))
    
    pdf.build(story)
    return report_filename


def export_migration_manifest_csv(documents: List[Document]) -> str:
    """Generates a CSV manifest suitable for HRMS bulk import."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Document_ID",
        "Original_Filename",
        "Restored_Filename",
        "Original_Resolution",
        "Restored_Resolution",
        "File_Size_Bytes",
        "Status",
        "Quality_Rating",
        "Readability",
        "Sharpness_Gain_Percent",
        "Processing_Time_MS",
        "Requires_Manual_Review",
        "Timestamp"
    ])
    for doc in documents:
        metrics = doc.metrics or {}
        g_analysis = doc.gemini_analysis or {}
        q_rating = g_analysis.get("image_quality", {}).get("rating", "N/A")
        readability = g_analysis.get("document_readability", "N/A")
        
        writer.writerow([
            doc.id,
            doc.original_filename,
            doc.restored_filename or "",
            f"{doc.width}x{doc.height}",
            f"{doc.restored_width or doc.width}x{doc.restored_height or doc.height}",
            doc.file_size_bytes,
            doc.status,
            q_rating,
            readability,
            metrics.get("sharpness_gain_percent", 0.0),
            metrics.get("processing_time_ms", 0.0),
            "YES" if doc.status == "REQUIRES_REVIEW" else "NO",
            doc.created_at.isoformat() if doc.created_at else ""
        ])
    return output.getvalue()
