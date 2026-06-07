import { jsPDF } from "jspdf";
import { CalculationResult } from "../types";

export function exportResultToPDF(result: CalculationResult, title: string, dateCreated: string, notes?: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const secondaryColor = [71, 85, 105]; // Slate 600
  const lightBg = [248, 250, 252]; // Slate 50
  const accentColor = [14, 116, 144]; // Cyan 700

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Header band
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 12, "F");

  // Document Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Simple Interest Calculation Report", margin, 30);

  // Thin separator
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Metadata Card
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin, 42, pageWidth - 2 * margin, 24, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("REPORT METADATA", margin + 6, 49);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Calculation Title: ${title || "Untitled Calculation"}`, margin + 6, 56);
  doc.text(`Generated On: ${new Date(dateCreated).toLocaleString()}`, pageWidth - margin - 80, 56);

  // Input Data Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("1. Input Parameters", margin, 80);

  // Input Data Row builder
  const renderRow = (y: number, label1: string, val1: string, label2: string, val2: string) => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(label1, margin + 4, y);
    doc.text(label2, pageWidth / 2 + 4, y);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(val1, margin + 4, y + 6);
    doc.text(val2, pageWidth / 2 + 4, y + 6);

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 10, pageWidth - margin, y + 10);
  };

  const fmtCurrency = (num: number) => {
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  renderRow(
    88,
    "Principal Amount",
    fmtCurrency(result.principal),
    "Monthly Rate (per ₹100 / Month)",
    `₹${result.rate} per ₹100 (equivalent to ${result.rate}%)`
  );

  renderRow(
    106,
    "Start Date (Loan Inception)",
    result.startDate,
    "End Date (Settlement Day)",
    result.endDate
  );

  // Duration Breakdown Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("2. Timeframe Analysis", margin, 134);

  // Duration Card
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin, 140, pageWidth - 2 * margin, 26, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("BROKEN DOWN DURATION", margin + 6, 147);
  doc.text("TOTAL EQUIVALENT DURATION", pageWidth / 2 + 6, 147);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  const periodText = `${result.durationYears} Yr${result.durationYears !== 1 ? 's' : ''}, ${result.durationMonths} Mo${result.durationMonths !== 1 ? 's' : ''}, ${result.durationDays} Day${result.durationDays !== 1 ? 's' : ''}`;
  doc.text(periodText, margin + 6, 156);
  doc.text(`${result.totalMonths.toFixed(2)} Months (Total: ${result.totalDays} Days)`, pageWidth / 2 + 6, 156);

  // Calculation Summary Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("3. Dynamic Settlement Summary", margin, 180);

  // Highlight Box
  doc.setFillColor(241, 245, 249); // slate 100
  doc.rect(margin, 186, pageWidth - 2 * margin, 42, "F");

  // Solid left bar indicator for aesthetics
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, 186, 4, 42, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("MONTHLY INTEREST PAYMENT", margin + 10, 195);
  doc.text("TOTAL ACCRUED INTEREST", margin + 10, 212);
  doc.text("TOTAL INVOICE SETTLEMENT AMOUNT", pageWidth / 2 + 10, 212);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(fmtCurrency(result.monthlyInterest), margin + 10, 202);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(fmtCurrency(result.totalInterest), margin + 10, 221);

  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(fmtCurrency(result.totalAmount), pageWidth / 2 + 10, 221);

  // Notes section
  if (notes && notes.trim() !== "") {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Calculation Notes & Remarks:", margin, 242);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(notes, margin, 248, { maxWidth: pageWidth - 2 * margin });
  }

  // Footer Info
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("This calculation is compiled as an offline computation reference.", margin, pageHeight - 12);
  doc.text("Simple Interest Calculator Dashboard", pageWidth - margin - 55, pageHeight - 12);

  // Download Action
  const cleanTitle = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "calculation";
  doc.save(`interest_report_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
