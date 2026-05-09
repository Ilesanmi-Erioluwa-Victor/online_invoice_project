const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      business_name: user.business_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register creates a new user account and returns a JWT plus user details.
router.post('/register', async (req, res) => {
  const { full_name, business_name, email, password } = req.body;
  const normalizedEmail = email?.toLowerCase();

  if (!full_name || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required' });
  }

  try {
    // This Prisma query checks the User model for an existing account with the submitted email.
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // This Prisma query creates a User record with a hashed password and returns the saved user.
    const user = await prisma.user.create({
      data: {
        full_name,
        business_name: business_name || null,
        email: normalizedEmail,
        password_hash: passwordHash,
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        business_name: user.business_name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// POST /api/auth/login verifies user credentials and returns a JWT plus user details.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // This Prisma query fetches the User model by email for password verification.
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        business_name: user.business_name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;

