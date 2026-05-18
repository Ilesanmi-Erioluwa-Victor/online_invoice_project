const express = require('express');
const axios = require('axios');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const generateInvoicePDF = require('../utils/generateInvoicePDF');
const sendOverdueReminders = require('../utils/sendOverdueReminders');
const sendReceipt = require('../utils/sendReceipt');
const { createMailTransport, getFromAddress, getMailErrorMessage } = require('../utils/mailer');

const router = express.Router();

router.use(authMiddleware);

// formatCurrency receives a numeric amount and returns a Nigerian Naira string for invoice emails.
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(Number(amount || 0));
}

// formatLongDate receives a date value and returns a long human-readable date.
function formatLongDate(dateValue) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(dateValue));
}

// flattenInvoice receives a Prisma Invoice with included relations and returns the flat shape used by the existing frontend and PDF utilities.
function flattenInvoice(invoice) {
  if (!invoice) {
    return null;
  }

  return {
    ...invoice,
    client_name: invoice.client?.client_name,
    client_email: invoice.client?.email,
    phone: invoice.client?.phone,
    address: invoice.client?.address,
    business_name: invoice.user?.business_name,
    full_name: invoice.user?.full_name,
    user_email: invoice.user?.email,
    bank_name: invoice.user?.bank_name,
    account_number: invoice.user?.account_number,
    account_name: invoice.user?.account_name,
  };
}

// generateInvoiceNumber receives a user id and Prisma transaction client, then returns the next invoice number.
async function generateInvoiceNumber(userId, tx = prisma) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // This Prisma query counts Invoice records for the user to build the next invoice number.
  const count = await tx.invoice.count({
    where: { user_id: userId },
  });

  return `INV-${datePart}-${String(count + 1).padStart(4, '0')}`;
}

// fetchInvoiceForUser receives invoice and user ids, then returns a full invoice object with line items.
async function fetchInvoiceForUser(invoiceId, userId) {
  // This Prisma query fetches one Invoice with Client, InvoiceItem, and User details for viewing, PDF, or email.
  const invoice = await prisma.invoice.findFirst({
    where: { id: Number(invoiceId), user_id: userId },
    include: {
      client: true,
      items: { orderBy: { id: 'asc' } },
      user: true,
    },
  });

  return flattenInvoice(invoice);
}

// fetchInvoiceAndClientForPayment receives invoice and user ids, then returns data needed for Paystack initialization.
async function fetchInvoiceAndClientForPayment(invoiceId, userId) {
  // This Prisma query fetches one Invoice with its Client for Paystack payment link creation.
  return prisma.invoice.findFirst({
    where: { id: Number(invoiceId), user_id: userId },
    include: { client: true },
  });
}

// GET /api/invoices updates overdue invoices and returns all invoices with client names.
router.get('/', async (req, res) => {
  try {
    // This Prisma query updates pending Invoice records to overdue when the due date has passed.
    await prisma.invoice.updateMany({
      where: {
        user_id: req.user.id,
        status: 'pending',
        due_date: { lt: new Date() },
      },
      data: { status: 'overdue' },
    });

    // This Prisma query fetches Invoice records for the authenticated user with Client details.
    const invoices = await prisma.invoice.findMany({
      where: { user_id: req.user.id },
      include: { client: true },
      orderBy: { created_at: 'desc' },
    });

    return res.json(invoices.map(flattenInvoice));
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch invoices', error: error.message });
  }
});

// POST /api/invoices/send-reminders immediately sends overdue reminder emails and returns a completion message.
router.post('/send-reminders', async (req, res) => {
  try {
    const sentCount = await sendOverdueReminders();
    return res.json({ message: 'Reminders sent', sent_count: sentCount });
  } catch (error) {
    return res.status(500).json({ message: 'Could not send reminders', error: error.message });
  }
});

// GET /api/invoices/:id returns one invoice with its client details and line items.
router.get('/:id', async (req, res) => {
  try {
    const invoice = await fetchInvoiceForUser(req.params.id, req.user.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch invoice', error: error.message });
  }
});

// GET /api/invoices/:id/pdf generates a PDF invoice for the logged-in user and sends it as a download.
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await fetchInvoiceForUser(req.params.id, req.user.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ message: 'Could not generate invoice PDF', error: error.message });
  }
});

// POST /api/invoices creates an invoice and its line items in a database transaction.
router.post('/', async (req, res) => {
  const { client_id, issue_date, due_date, tax_rate, discount, subtotal, total, notes, items } = req.body;

  if (!client_id || !issue_date || !due_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Client, dates, and at least one line item are required' });
  }

  try {
    // This Prisma query confirms that the selected Client belongs to the authenticated user.
    const client = await prisma.client.findFirst({
      where: { id: Number(client_id), user_id: req.user.id },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // This Prisma transaction creates one Invoice and all related InvoiceItem records atomically.
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await generateInvoiceNumber(req.user.id, tx);

      return tx.invoice.create({
        data: {
          user_id: req.user.id,
          client_id: Number(client_id),
          invoice_number: invoiceNumber,
          issue_date: new Date(issue_date),
          due_date: new Date(due_date),
          tax_rate: Number(tax_rate || 0),
          discount: Number(discount || 0),
          subtotal: Number(subtotal || 0),
          total: Number(total || 0),
          notes: notes || null,
          items: {
            create: items.map((item) => ({
              description: item.description,
              quantity: Number(item.quantity || 0),
              unit_price: Number(item.unit_price || 0),
              line_total: Number(item.line_total || 0),
            })),
          },
        },
        include: { items: true },
      });
    });

    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: 'Could not create invoice', error: error.message });
  }
});

// POST /api/invoices/:id/payment-link creates a Paystack test payment link for the invoice and returns the link plus reference.
router.post('/:id/payment-link', async (req, res) => {
  try {
    const invoice = await fetchInvoiceAndClientForPayment(req.params.id, req.user.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: invoice.client.email,
        amount: Math.round(Number(invoice.total) * 100),
        currency: 'NGN',
        reference: invoice.invoice_number,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_name: invoice.client.client_name,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const authorizationUrl = response.data.data.authorization_url;
    const reference = response.data.data.reference;

    // This Prisma query saves the Paystack payment reference and hosted payment link on the Invoice.
    await prisma.invoice.update({
      where: { id: Number(req.params.id) },
      data: {
        payment_reference: reference,
        payment_link: authorizationUrl,
      },
    });

    return res.json({ payment_link: authorizationUrl, reference });
  } catch (error) {
    return res.status(500).json({
      message: 'Could not create Paystack payment link',
      error: error.response?.data?.message || error.message,
    });
  }
});

// PUT /api/invoices/:id/status updates an invoice status for the logged-in user.
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['pending', 'paid', 'overdue'];
  const invoiceId = Number(req.params.id);

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    // This Prisma query updates Invoice status only when the invoice belongs to the authenticated user.
    const result = await prisma.invoice.updateMany({
      where: { id: invoiceId, user_id: req.user.id },
      data: {
        status,
        ...(status === 'paid' ? { paid_at: new Date() } : {}),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // This Prisma query fetches the updated Invoice record to return to the frontend.
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (status === 'paid') {
      await sendReceipt(invoiceId);
    }

    return res.json(updatedInvoice);
  } catch (error) {
    return res.status(500).json({ message: 'Could not update invoice status', error: error.message });
  }
});

// DELETE /api/invoices/:id deletes an invoice and its line items through database cascade rules.
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: Number(req.params.id), user_id: req.user.id },
      select: { id: true, status: true },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Paid invoices cannot be deleted' });
    }

    // This Prisma query deletes Invoice records only when the id and authenticated owner match.
    await prisma.invoice.deleteMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
    });

    return res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete invoice', error: error.message });
  }
});

// POST /api/invoices/:id/send emails the selected invoice to the client's email address with a PDF attachment.
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await fetchInvoiceForUser(req.params.id, req.user.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Paid invoices cannot be sent to clients' });
    }

    const businessName = invoice.business_name || invoice.full_name;
    const pdfBuffer = await generateInvoicePDF(invoice);
    const payOnlineHtml = invoice.payment_link
      ? `<p><a href="${invoice.payment_link}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;">Pay Online</a></p>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <p>Dear ${invoice.client_name},</p>
        <p>Please find attached invoice #${invoice.invoice_number} for your reference.</p>
        <p><strong>Amount Due:</strong> ${formatCurrency(invoice.total)}</p>
        <p><strong>Due Date:</strong> ${formatLongDate(invoice.due_date)}</p>
        <p><strong>Payment Details:</strong></p>
        <p>Bank: ${invoice.bank_name || '-'}</p>
        <p>Account Number: ${invoice.account_number || '-'}</p>
        <p>Account Name: ${invoice.account_name || '-'}</p>
        ${payOnlineHtml}
        <p>Please use your invoice number (${invoice.invoice_number}) as your payment reference.</p>
        <p>Thank you for your business.</p>
        <p>${businessName}</p>
      </div>
    `;

    const transporter = createMailTransport();

    await transporter.sendMail({
      from: getFromAddress(businessName),
      to: invoice.client_email,
      subject: `Invoice #${invoice.invoice_number} from ${businessName}`,
      html,
      attachments: [{ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer }],
    });

    return res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not send invoice email', error: getMailErrorMessage(error) });
  }
});

module.exports = router;
