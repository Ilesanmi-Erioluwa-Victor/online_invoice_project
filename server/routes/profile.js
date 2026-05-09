const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/profile receives the logged-in user id from JWT middleware and returns the user's profile without password_hash.
router.get('/', async (req, res) => {
  try {
    // This Prisma query fetches one User profile by id and returns safe profile fields only.
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        full_name: true,
        business_name: true,
        email: true,
        bank_name: true,
        account_number: true,
        account_name: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch profile', error: error.message });
  }
});

// PUT /api/profile receives profile form fields, updates the logged-in user, and returns the updated profile.
router.put('/', async (req, res) => {
  const { full_name, business_name, bank_name, account_number, account_name } = req.body;

  if (!full_name) {
    return res.status(400).json({ message: 'Full name is required' });
  }

  try {
    // This Prisma query updates one User profile and returns the fields shown on the profile page.
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        full_name,
        business_name: business_name || null,
        bank_name: bank_name || null,
        account_number: account_number || null,
        account_name: account_name || null,
      },
      select: {
        id: true,
        full_name: true,
        business_name: true,
        email: true,
        bank_name: true,
        account_number: true,
        account_name: true,
        created_at: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Could not update profile', error: error.message });
  }
});

module.exports = router;

