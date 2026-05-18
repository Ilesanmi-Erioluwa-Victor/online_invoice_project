const prisma = require('../lib/prisma');
const { createMailTransport, getFromAddress } = require('./mailer');

// formatCurrency receives a numeric amount and returns a Nigerian Naira string for reminder emails.
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(Number(amount || 0));
}

// formatDate receives a date value and returns a readable date for reminder emails.
function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(dateValue));
}

// sendOverdueReminders finds overdue invoices, emails clients reminders, and returns the number of messages sent.
async function sendOverdueReminders() {
  // This Prisma query fetches overdue Invoice records with Client and User payment details.
  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: 'overdue' },
    include: { client: true, user: true },
  });

  const transporter = createMailTransport();

  for (const invoice of overdueInvoices) {
    const businessName = invoice.user.business_name || invoice.user.full_name;

    await transporter.sendMail({
      from: getFromAddress(businessName),
      to: invoice.client.email,
      subject: `Payment Reminder - Invoice #${invoice.invoice_number} is Overdue`,
      html: `
        <p>Dear ${invoice.client.client_name},</p>
        <p>This is a reminder that invoice #${invoice.invoice_number} is now overdue.</p>
        <p><strong>Amount Due:</strong> ${formatCurrency(invoice.total)}</p>
        <p><strong>Original Due Date:</strong> ${formatDate(invoice.due_date)}</p>
        <p>Please make payment as soon as possible using the details below:</p>
        <p><strong>Bank:</strong> ${invoice.user.bank_name || '-'}</p>
        <p><strong>Account Number:</strong> ${invoice.user.account_number || '-'}</p>
        <p><strong>Account Name:</strong> ${invoice.user.account_name || '-'}</p>
        <p>If you have already made payment, please disregard this message.</p>
        <p>${businessName}</p>
      `,
    });
  }

  return overdueInvoices.length;
}

module.exports = sendOverdueReminders;
