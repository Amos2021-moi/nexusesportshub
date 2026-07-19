import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface PaymentData {
  payments: Payment[];
  stats: {
    totalRevenue: number;
    totalPayments: number;
    successRate: number;
    averageFee: number;
  };
  dateRange: { from: string; to: string };
  platformName: string;
}

interface Payment {
  id: string;
  playerName: string;
  playerEmail: string;
  amount: number;
  status: string;
  method: string;
  seasonName: string;
  receipt: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ✅ Format Currency
function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

// ✅ Format Date
function formatDate(date: string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ✅ Get Status Label
function getStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Paid";
    case "PAYMENT_PENDING":
      return "Pending";
    case "NOT_ENROLLED":
      return "Failed";
    case "REFUNDED":
      return "Refunded";
    default:
      return status;
  }
}

// ✅ Generate Clean PDF Report
export function generatePDFReport(data: PaymentData): void {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ✅ Colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const goldColor: [number, number, number] = [217, 119, 6]; // Gold/Amber
  const darkColor: [number, number, number] = [30, 30, 30];
  const lightGray: [number, number, number] = [245, 245, 250];

  // ============================================================
  // HEADER
  // ============================================================

  // ✅ Header Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 7, "F");

  // ✅ Gold Line
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setLineWidth(1.5);
  doc.line(20, 18, pageWidth - 20, 18);

  // ✅ Logo
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Nexus Esports", 20, 30);

  // ✅ Tagline
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  doc.text("Payment Analytics Report", 20, 37);

  // ✅ Report Meta
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${formatDate(data.dateRange.from)} - ${formatDate(data.dateRange.to)}`, 20, 45);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 51);

  // ✅ Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(20, 55, pageWidth - 20, 55);

  // ============================================================
  // STATS CARDS
  // ============================================================

  const stats = data.stats;
  const cardY = 65;
  const cardWidth = 42;
  const gap = 4;

  const statsItems = [
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue) },
    { label: "Total Payments", value: stats.totalPayments.toString() },
    { label: "Success Rate", value: `${stats.successRate.toFixed(1)}%` },
    { label: "Avg Fee", value: formatCurrency(stats.averageFee) },
  ];

  let x = 20;
  for (const item of statsItems) {
    // Card background
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(x, cardY, cardWidth, 26, 2, 2, "F");

    // Card border
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardWidth, 26, 2, 2, "S");

    // Value
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(item.value, x + 3, cardY + 12);

    // Label
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, x + 3, cardY + 22);

    x += cardWidth + gap;
  }

  // ============================================================
  // TABLE
  // ============================================================

  const tableY = cardY + 34;

  // ✅ Table Title
  doc.setFontSize(13);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Transactions", 20, tableY);

  // ✅ Table Headers
  const headers = ["Player", "Email", "Amount", "Status", "Method", "Season", "Date"];
  const rows = data.payments.map((p) => [
    p.playerName || "Unknown",
    p.playerEmail || "N/A",
    formatCurrency(p.amount),
    getStatusLabel(p.status),
    p.method || "N/A",
    p.seasonName || "N/A",
    p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt),
  ]);

  // ✅ Generate Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: tableY + 5,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [50, 50, 50],
      font: "helvetica",
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { cellWidth: 28, halign: "left" },
      1: { cellWidth: 38, halign: "left" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 24, halign: "left" },
      6: { cellWidth: 22, halign: "center" },
    },
    margin: { left: 20, right: 20 },
    didDrawPage: (data: any) => {
      const pageNum = data.pageNumber || 1;
      const totalPages = data.pageCount || 1;

      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 14, pageWidth - 20, pageHeight - 14);

      // Gold dot
      doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.circle(pageWidth / 2 - 5, pageHeight - 8, 1.5, "F");

      // Footer text
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2 + 3, pageHeight - 6, { align: "center" });
      doc.text("Nexus Esports", pageWidth - 20, pageHeight - 6, { align: "right" });
    },
  });

  // ✅ Save
  doc.save(`payment-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ✅ Generate Excel Report
export function generateExcelReport(data: PaymentData): void {
  const wb = XLSX.utils.book_new();

  // ✅ Summary Sheet
  const summaryData = [
    ["Nexus Esports"],
    ["Payment Analytics Report"],
    [],
    ["Report Period", `${formatDate(data.dateRange.from)} - ${formatDate(data.dateRange.to)}`],
    ["Generated", new Date().toLocaleString()],
    ["Platform", data.platformName],
    [],
    ["Revenue Summary"],
    ["Total Revenue", data.stats.totalRevenue],
    ["Total Payments", data.stats.totalPayments],
    ["Success Rate", `${data.stats.successRate.toFixed(1)}%`],
    ["Average Entry Fee", data.stats.averageFee],
    [],
    ["Generated by Nexus Esports"],
  ];

  const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWS["!cols"] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

  // ✅ Payments Sheet
  const paymentData = [
    ["#", "Player", "Email", "Amount (KES)", "Status", "Method", "Season", "Date"],
    ...data.payments.map((p, i) => [
      i + 1,
      p.playerName || "Unknown",
      p.playerEmail || "N/A",
      p.amount,
      getStatusLabel(p.status),
      p.method || "N/A",
      p.seasonName || "N/A",
      p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt),
    ]),
  ];

  const paymentsWS = XLSX.utils.aoa_to_sheet(paymentData);
  paymentsWS["!cols"] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, paymentsWS, "Payments");

  XLSX.writeFile(wb, `payment-report-${new Date().toISOString().split("T")[0]}.xlsx`);
}