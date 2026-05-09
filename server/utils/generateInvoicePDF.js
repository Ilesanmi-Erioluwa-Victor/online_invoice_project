const PDFDocument = require('pdfkit');

// formatCurrency receives a numeric amount and returns it as Nigerian Naira text for the PDF.
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(Number(amount || 0));
}

// formatDate receives a date value and returns a readable date for the PDF.
function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(dateValue));
}

// addKeyValue receives a PDF document and label/value details, then writes one labelled line.
function addKeyValue(doc, label, value, x, y) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(label, x, y, { continued: true });
  doc.font('Helvetica').fillColor('#374151').text(` ${value || '-'}`);
}

// generateInvoicePDF receives full invoice, client, user, and item data, then returns a PDF Buffer.
function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];
    const businessName = invoiceData.business_name || invoiceData.full_name || 'Business';
    const taxAmount = (Number(invoiceData.subtotal || 0) * Number(invoiceData.tax_rate || 0)) / 100;

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(22).fillColor('#111827').text(businessName, 45, 45);
    doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(invoiceData.user_email || '', 45, 74);

    doc.font('Helvetica-Bold').fontSize(26).fillColor('#3730a3').text('INVOICE', 390, 45, { align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor('#111827');
    doc.text(`Invoice No: ${invoiceData.invoice_number}`, 350, 82, { align: 'right' });
    doc.text(`Issue Date: ${formatDate(invoiceData.issue_date)}`, 350, 98, { align: 'right' });
    doc.text(`Due Date: ${formatDate(invoiceData.due_date)}`, 350, 114, { align: 'right' });

    doc.moveTo(45, 140).lineTo(550, 140).strokeColor('#d1d5db').stroke();

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Bill To', 45, 160);
    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    doc.text(invoiceData.client_name || '-', 45, 180);
    doc.text(invoiceData.client_email || '-', 45, 196);
    doc.text(invoiceData.phone || '-', 45, 212);
    doc.text(invoiceData.address || '-', 45, 228, { width: 230 });

    const tableTop = 275;
    const columns = { description: 55, qty: 310, unit: 370, total: 465 };

    doc.rect(45, tableTop, 505, 24).fill('#111827');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('Description', columns.description, tableTop + 8);
    doc.text('Qty', columns.qty, tableTop + 8);
    doc.text('Unit Price', columns.unit, tableTop + 8);
    doc.text('Line Total', columns.total, tableTop + 8);

    let y = tableTop + 24;
    invoiceData.items.forEach((item, index) => {
      const rowHeight = 26;
      if (index % 2 === 0) {
        doc.rect(45, y, 505, rowHeight).fill('#f3f4f6');
      }
      doc.font('Helvetica').fontSize(9).fillColor('#111827');
      doc.text(item.description, columns.description, y + 8, { width: 235 });
      doc.text(String(item.quantity), columns.qty, y + 8);
      doc.text(formatCurrency(item.unit_price), columns.unit, y + 8);
      doc.text(formatCurrency(item.line_total), columns.total, y + 8);
      y += rowHeight;
    });

    y += 25;
    const summaryX = 350;
    addKeyValue(doc, 'Subtotal:', formatCurrency(invoiceData.subtotal), summaryX, y);
    addKeyValue(doc, `Tax (${Number(invoiceData.tax_rate || 0)}%):`, formatCurrency(taxAmount), summaryX, y + 18);
    addKeyValue(doc, 'Discount:', `-${formatCurrency(invoiceData.discount)}`, summaryX, y + 36);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text(`Total: ${formatCurrency(invoiceData.total)}`, summaryX, y + 60);

    const paymentTop = y + 105;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Payment Details', 45, paymentTop);
    addKeyValue(doc, 'Bank:', invoiceData.bank_name, 45, paymentTop + 22);
    addKeyValue(doc, 'Account Number:', invoiceData.account_number, 45, paymentTop + 40);
    addKeyValue(doc, 'Account Name:', invoiceData.account_name, 45, paymentTop + 58);
    doc.font('Helvetica').fontSize(10).fillColor('#374151').text(
      'Payment Instructions: Please make payment before the due date and use the invoice number as your payment reference.',
      45,
      paymentTop + 82,
      { width: 500 }
    );

    if (invoiceData.payment_link) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Pay Online:', 45, paymentTop + 120, { continued: true });
      doc.font('Helvetica').fillColor('#3730a3').text(` ${invoiceData.payment_link}`, { width: 430 });
    }

    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('Thank you for your business.', 45, 790, {
      align: 'center',
      width: 505,
    });

    doc.end();
  });
}

module.exports = generateInvoicePDF;
