const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/reports/summary returns invoice totals and counts for the logged-in user.
router.get('/summary', async (req, res) => {
  try {
    // This Prisma query updates Invoice records from pending to overdue when their due dates have passed.
    await prisma.invoice.updateMany({
      where: {
        user_id: req.user.id,
        status: 'pending',
        due_date: { lt: new Date() },
      },
      data: { status: 'overdue' },
    });

    // This Prisma query fetches Invoice status and total fields for JavaScript summary calculation.
    const invoices = await prisma.invoice.findMany({
      where: { user_id: req.user.id },
      select: { status: true, total: true },
    });

    const summary = {
      invoice_count: invoices.length,
      total_invoiced: invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0),
      total_paid: invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + Number(invoice.total), 0),
      total_pending: invoices.filter((invoice) => invoice.status === 'pending').reduce((sum, invoice) => sum + Number(invoice.total), 0),
      total_overdue: invoices.filter((invoice) => invoice.status === 'overdue').reduce((sum, invoice) => sum + Number(invoice.total), 0),
      paid_count: invoices.filter((invoice) => invoice.status === 'paid').length,
      pending_count: invoices.filter((invoice) => invoice.status === 'pending').length,
      overdue_count: invoices.filter((invoice) => invoice.status === 'overdue').length,
    };

    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch report summary', error: error.message });
  }
});

module.exports = router;

