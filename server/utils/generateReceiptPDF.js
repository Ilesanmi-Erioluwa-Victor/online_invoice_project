const PDFDocument = require('pdfkit');

// formatCurrency receives a numeric amount and returns it as Nigerian Naira text for the receipt.
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(Number(amount || 0));
}

// formatDate receives a date value and returns a readable receipt date.
function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(dateValue));
}

// generateReceiptPDF receives receipt and invoice data, then returns a receipt PDF Buffer.
function generateReceiptPDF(receiptData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];
    const businessName = receiptData.business_name || receiptData.full_name || 'Business';

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(22).fillColor('#111827').text(businessName, 45, 45);
    doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(receiptData.user_email || '', 45, 74);
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#16a34a').text('RECEIPT', 380, 45, { align: 'right' });

    doc.font('Helvetica').fontSize(10).fillColor('#111827');
    doc.text(`Receipt Number: RCP-${receiptData.invoice_number}`, 45, 120);
    doc.text(`Date Paid: ${formatDate(receiptData.paid_at || new Date())}`, 45, 138);
    doc.text(`Invoice Reference: ${receiptData.invoice_number}`, 45, 156);

    doc.moveTo(45, 185).lineTo(550, 185).strokeColor('#d1d5db').stroke();

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Paid To / Received From', 45, 210);
    doc.font('Helvetica').fontSize(10).fillColor('#374151').text(`Client: ${receiptData.client_name}`, 45, 235);
    doc.text(`Email: ${receiptData.client_email}`, 45, 253);

    doc.rect(45, 305, 505, 24).fill('#111827');
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text('Description', 55, 313);
    doc.text('Amount', 460, 313);
    doc.rect(45, 329, 505, 34).fill('#f3f4f6');
    doc.font('Helvetica').fontSize(10).fillColor('#111827').text(`Services as per Invoice #${receiptData.invoice_number}`, 55, 342);
    doc.text(formatCurrency(receiptData.total), 430, 342);

    doc.rect(45, 405, 505, 60).fill('#dcfce7');
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#166534').text(
      `PAYMENT RECEIVED - ${formatCurrency(receiptData.total)}`,
      65,
      426,
      { align: 'center', width: 465 }
    );

    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(
      'This is an official receipt. Thank you for your payment.',
      45,
      790,
      { align: 'center', width: 505 }
    );

    doc.end();
  });
}

module.exports = generateReceiptPDF;
