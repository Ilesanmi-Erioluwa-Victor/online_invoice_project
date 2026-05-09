const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/clients returns all clients that belong to the logged-in user.
router.get('/', async (req, res) => {
  try {
    // This Prisma query fetches Client records owned by the authenticated user, newest first.
    const clients = await prisma.client.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });

    return res.json(clients);
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch clients', error: error.message });
  }
});

// POST /api/clients creates a new client for the logged-in user and returns the saved record.
router.post('/', async (req, res) => {
  const { client_name, email, phone, address } = req.body;

  if (!client_name || !email) {
    return res.status(400).json({ message: 'Client name and email are required' });
  }

  try {
    // This Prisma query creates a Client record linked to the authenticated user.
    const client = await prisma.client.create({
      data: {
        user_id: req.user.id,
        client_name,
        email,
        phone: phone || null,
        address: address || null,
      },
    });

    return res.status(201).json(client);
  } catch (error) {
    return res.status(500).json({ message: 'Could not create client', error: error.message });
  }
});

// PUT /api/clients/:id updates a client owned by the logged-in user and returns the updated record.
router.put('/:id', async (req, res) => {
  const { client_name, email, phone, address } = req.body;
  const clientId = Number(req.params.id);

  if (!client_name || !email) {
    return res.status(400).json({ message: 'Client name and email are required' });
  }

  try {
    // This Prisma query updates Client records only when the id and authenticated owner match.
    const result = await prisma.client.updateMany({
      where: { id: clientId, user_id: req.user.id },
      data: {
        client_name,
        email,
        phone: phone || null,
        address: address || null,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // This Prisma query fetches the updated Client record to return to the frontend.
    const updatedClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    return res.json(updatedClient);
  } catch (error) {
    return res.status(500).json({ message: 'Could not update client', error: error.message });
  }
});

// DELETE /api/clients/:id removes a client owned by the logged-in user.
router.delete('/:id', async (req, res) => {
  try {
    // This Prisma query deletes Client records only when the id and authenticated owner match.
    const result = await prisma.client.deleteMany({
      where: { id: Number(req.params.id), user_id: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    return res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete client', error: error.message });
  }
});

module.exports = router;

