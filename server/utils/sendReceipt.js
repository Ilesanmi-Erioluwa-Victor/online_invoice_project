const prisma = require('../lib/prisma');
const generateReceiptPDF = require('./generateReceiptPDF');
const { createMailTransport, getFromAddress } = require('./mailer');

// formatCurrency receives a numeric amount and returns a Nigerian Naira string for receipt emails.
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(Number(amount || 0));
}

// formatDate receives a date value and returns a readable date for receipt emails.
function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(dateValue));
}

// flattenReceiptData receives a Prisma Invoice with relations and returns the flat shape used by the receipt PDF utility.
function flattenReceiptData(invoice) {
  return {
    ...invoice,
    client_name: invoice.client.client_name,
    client_email: invoice.client.email,
    business_name: invoice.user.business_name,
    full_name: invoice.user.full_name,
    user_email: invoice.user.email,
  };
}

// sendReceipt receives an invoice id, generates a receipt PDF, emails it to the client, and returns the mail result.
async function sendReceipt(invoiceId) {
  // This Prisma query fetches one Invoice with Client, User, and InvoiceItem details needed for a receipt email.
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(invoiceId) },
    include: { client: true, user: true, items: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found for receipt');
  }

  const receiptData = flattenReceiptData(invoice);
  const businessName = receiptData.business_name || receiptData.full_name;
  const pdfBuffer = await generateReceiptPDF(receiptData);

  const transporter = createMailTransport();

  return transporter.sendMail({
    from: getFromAddress(businessName),
    to: receiptData.client_email,
    subject: `Receipt for Invoice #${receiptData.invoice_number} - Payment Confirmed`,
    html: `
      <p>Dear ${receiptData.client_name},</p>
      <p>Thank you for your payment. Please find your receipt attached.</p>
      <p><strong>Amount Paid:</strong> ${formatCurrency(receiptData.total)}</p>
      <p><strong>Date Paid:</strong> ${formatDate(receiptData.paid_at || new Date())}</p>
      <p><strong>Receipt Reference:</strong> RCP-${receiptData.invoice_number}</p>
      <p>${businessName}</p>
    `,
    attachments: [{ filename: `receipt-${receiptData.invoice_number}.pdf`, content: pdfBuffer }],
  });
}

module.exports = sendReceipt;
