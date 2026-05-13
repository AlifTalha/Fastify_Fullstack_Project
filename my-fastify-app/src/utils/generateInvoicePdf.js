"use strict";

const PDFDocument = require("pdfkit");

/**
 * Generates an invoice PDF for a given order.
 * Returns the PDFDocument stream — caller is responsible for piping and ending.
 * @param {object} order - Full order object with user and product included
 * @returns {import('pdfkit')} PDFDocument instance
 */
function generateInvoicePdf(order) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  const currency = order.currency?.toUpperCase() || "USD";
  const unitPrice = (order.product.price / 100).toFixed(2);
  const total = (order.amount / 100).toFixed(2);
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── Header ──────────────────────────────────────────────────────────────
  doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", { align: "right" });

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Invoice No: ${order.invoiceNumber}`, { align: "right" })
    .text(`Date: ${date}`, { align: "right" })
    .text(`Status: ${order.status}`, { align: "right" });

  doc.moveDown(2);

  // ── Divider ─────────────────────────────────────────────────────────────
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(1);

  // ── Bill To ─────────────────────────────────────────────────────────────
  doc.fontSize(11).font("Helvetica-Bold").text("BILL TO");
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(order.user.name || "—")
    .text(order.user.email);

  doc.moveDown(2);

  // ── Table Header ─────────────────────────────────────────────────────────
  const colDesc = 50;
  const colQty = 310;
  const colUnit = 380;
  const colTotal = 460;

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff");

  // Header background
  doc.rect(50, doc.y, 495, 20).fillColor("#2c3e50").fill();

  const headerY = doc.y - 15;
  doc
    .fillColor("#ffffff")
    .text("DESCRIPTION", colDesc, headerY)
    .text("QTY", colQty, headerY)
    .text("UNIT PRICE", colUnit, headerY)
    .text("TOTAL", colTotal, headerY);

  doc.moveDown(0.4);

  // ── Table Row ─────────────────────────────────────────────────────────────
  const rowY = doc.y;
  doc.rect(50, rowY, 495, 24).fillColor("#f2f2f2").fill();

  doc
    .fillColor("#000000")
    .font("Helvetica")
    .fontSize(10)
    .text(order.product.name, colDesc, rowY + 6, { width: 250 })
    .text(String(order.quantity), colQty, rowY + 6)
    .text(`${currency} ${unitPrice}`, colUnit, rowY + 6)
    .text(`${currency} ${total}`, colTotal, rowY + 6);

  doc.moveDown(2.5);

  // ── Totals ────────────────────────────────────────────────────────────────
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(0.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(`Total: ${currency} ${total}`, { align: "right" });

  doc.moveDown(3);

  // ── Footer ────────────────────────────────────────────────────────────────
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#888888")
    .text("Thank you for your purchase!", { align: "center" });

  if (order.stripePaymentIntentId) {
    doc
      .fontSize(8)
      .fillColor("#aaaaaa")
      .text(`Payment ref: ${order.stripePaymentIntentId}`, { align: "center" });
  }

  // Do NOT call doc.end() here — caller controls when to end
  return doc;
}

module.exports = generateInvoicePdf;
