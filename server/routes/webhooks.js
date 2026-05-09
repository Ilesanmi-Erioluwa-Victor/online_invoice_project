const crypto = require('crypto');
const prisma = require('../lib/prisma');
const sendReceipt = require('../utils/sendReceipt');

// paystackWebhookHandler receives Paystack raw webhook requests, verifies the signature, updates paid invoices, and returns an HTTP status.
async function paystackWebhookHandler(req, res) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');

    if (hash !== signature) {
      return res.status(401).json({ message: 'Invalid Paystack signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // This Prisma query updates one Invoice as paid by matching Paystack reference to invoice_number.
      const invoice = await prisma.invoice.update({
        where: { invoice_number: reference },
        data: { status: 'paid', paid_at: new Date() },
      });

      await sendReceipt(invoice.id);
    }

    return res.sendStatus(200);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.sendStatus(200);
    }

    return res.status(500).json({ message: 'Could not process Paystack webhook', error: error.message });
  }
}

module.exports = paystackWebhookHandler;

