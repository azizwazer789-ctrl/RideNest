"""PDF invoice rendering via ReportLab.

Pure presentation layer: takes an already-assembled data dict and returns
raw PDF bytes. No database access happens here — InvoiceService is
responsible for gathering the data and persisting the generated file.
"""

from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# Where generated invoice PDFs are cached on disk, relative to the backend
# project root (this file lives at <root>/utils/invoice_pdf.py).
BACKEND_ROOT = Path(__file__).resolve().parent.parent
GENERATED_INVOICES_DIR = BACKEND_ROOT / "generated_invoices"

BRAND_COLOR = colors.HexColor("#1a1a2e")


def _esc(value) -> str:
    """Escape a value for safe embedding in a ReportLab Paragraph (mini-XML)."""
    return escape(str(value)) if value is not None else ""


def render_invoice_pdf(data: dict) -> bytes:
    """Render a single-page PDF invoice from an assembled data dict.

    Expected keys: invoice_number, created_at, subtotal, tax, discount,
    total, customer_name, customer_email, vendor_name, vendor_email,
    vehicle_title, vehicle_brand, vehicle_model, vehicle_year, start_date,
    end_date, pickup_location, dropoff_location, payment_method,
    payment_status, transaction_reference, paid_at.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        title=f"Invoice {data['invoice_number']}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        alignment=TA_RIGHT,
        textColor=BRAND_COLOR,
    )
    meta_style = ParagraphStyle("InvoiceMeta", parent=styles["Normal"], alignment=TA_RIGHT)
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading3"], textColor=BRAND_COLOR, spaceAfter=4
    )
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"], textColor=colors.grey, fontSize=8
    )
    normal = styles["Normal"]

    elements = []

    # --- Header: company logo placeholder + invoice title/meta ---
    logo_placeholder = Table([["RideNest"]], colWidths=[60 * mm], rowHeights=[18 * mm])
    logo_placeholder.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 1, BRAND_COLOR),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 16),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_COLOR),
            ]
        )
    )

    created_at_str = data["created_at"].strftime("%Y-%m-%d")
    header_right = [
        Paragraph("INVOICE", title_style),
        Paragraph(f"Invoice #: {_esc(data['invoice_number'])}", meta_style),
        Paragraph(f"Date: {created_at_str}", meta_style),
    ]

    header_table = Table([[logo_placeholder, header_right]], colWidths=[80 * mm, 90 * mm])
    header_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(header_table)
    elements.append(Spacer(1, 10 * mm))

    # --- Customer / Vendor ---
    party_table = Table(
        [
            [Paragraph("Billed To", section_style), Paragraph("Vendor", section_style)],
            [
                Paragraph(
                    f"{_esc(data['customer_name'])}<br/>{_esc(data['customer_email'])}", normal
                ),
                Paragraph(
                    f"{_esc(data['vendor_name'])}<br/>{_esc(data['vendor_email'])}", normal
                ),
            ],
        ],
        colWidths=[85 * mm, 85 * mm],
    )
    party_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(party_table)
    elements.append(Spacer(1, 8 * mm))

    # --- Vehicle & rental details ---
    elements.append(Paragraph("Vehicle &amp; Rental Details", section_style))
    vehicle_rows = [
        [
            "Vehicle",
            f"{data['vehicle_brand']} {data['vehicle_model']} "
            f"({data['vehicle_year']}) — {data['vehicle_title']}",
        ],
        ["Rental Period", f"{data['start_date']} to {data['end_date']}"],
        ["Pickup Location", data["pickup_location"]],
        ["Drop-off Location", data["dropoff_location"]],
    ]
    vehicle_table = Table(vehicle_rows, colWidths=[40 * mm, 130 * mm])
    vehicle_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(vehicle_table)
    elements.append(Spacer(1, 8 * mm))

    # --- Payment information ---
    elements.append(Paragraph("Payment Information", section_style))
    paid_at_str = data["paid_at"].strftime("%Y-%m-%d %H:%M UTC") if data["paid_at"] else "—"
    payment_rows = [
        ["Payment Method", data["payment_method"]],
        ["Payment Status", str(data["payment_status"]).upper()],
        ["Transaction Reference", data["transaction_reference"] or "—"],
        ["Paid At", paid_at_str],
    ]
    payment_table = Table(payment_rows, colWidths=[40 * mm, 130 * mm])
    payment_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(payment_table)
    elements.append(Spacer(1, 10 * mm))

    # --- Totals ---
    totals_rows = [
        ["Subtotal", f"{data['subtotal']:.2f}"],
        ["Tax", f"{data['tax']:.2f}"],
        ["Discount", f"-{data['discount']:.2f}"],
        ["Total", f"{data['total']:.2f}"],
    ]
    totals_table = Table(totals_rows, colWidths=[140 * mm, 30 * mm])
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, -1), (-1, -1), 12),
                ("LINEABOVE", (0, -1), (-1, -1), 1, BRAND_COLOR),
                ("TOPPADDING", (0, -1), (-1, -1), 6),
            ]
        )
    )
    elements.append(totals_table)
    elements.append(Spacer(1, 14 * mm))

    elements.append(
        Paragraph(
            "Thank you for booking with RideNest. This is a system-generated invoice.",
            footer_style,
        )
    )

    doc.build(elements)
    return buffer.getvalue()
