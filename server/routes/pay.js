const express = require('express');
const prisma = require('../lib/prisma');
const sendReceipt = require('../utils/sendReceipt');

const router = express.Router();

// fetchPublicInvoice receives an invoice number and returns public payment details for that invoice.
async function fetchPublicInvoice(invoiceNumber) {
  // This Prisma query fetches one Invoice by invoice_number with Client, User, and InvoiceItem details.
  return prisma.invoice.findUnique({
    where: { invoice_number: invoiceNumber },
    include: { client: true, user: true, items: true },
  });
}

// GET /api/pay/:invoice_number receives an invoice number and returns public payment information for that invoice.
router.get('/:invoice_number', async (req, res) => {
  try {
    const invoice = await fetchPublicInvoice(req.params.invoice_number);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.json({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      total: invoice.total,
      due_date: invoice.due_date,
      status: invoice.status,
      paid_at: invoice.paid_at,
      payment_link: invoice.payment_link,
      client_name: invoice.client.client_name,
      business_name: invoice.user.business_name || invoice.user.full_name,
      bank_name: invoice.user.bank_name,
      account_number: invoice.user.account_number,
      account_name: invoice.user.account_name,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch invoice payment details', error: error.message });
  }
});

// POST /api/pay/:invoice_number/confirm receives an invoice number, marks it paid, sends a receipt, and returns a confirmation message.
router.post('/:invoice_number/confirm', async (req, res) => {
  try {
    // This Prisma query updates one Invoice by invoice_number after client manual payment confirmation.
    const invoice = await prisma.invoice.update({
      where: { invoice_number: req.params.invoice_number },
      data: { status: 'paid', paid_at: new Date() },
    });

    await sendReceipt(invoice.id);
    return res.json({ message: 'Payment confirmed' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.status(500).json({ message: 'Could not confirm payment', error: error.message });
  }
});

module.exports = router;

