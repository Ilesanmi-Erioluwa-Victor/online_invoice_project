require('dotenv').config();

const cors = require('cors');
const express = require('express');
const cron = require('node-cron');
const initDB = require('./db/init');
const authMiddleware = require('./middleware/auth');
const sendOverdueReminders = require('./utils/sendOverdueReminders');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const invoiceRoutes = require('./routes/invoices');
const payRoutes = require('./routes/pay');
const paystackWebhookHandler = require('./routes/webhooks');
const profileRoutes = require('./routes/profile');
const reportRoutes = require('./routes/reports');

const app = express();
// Render assigns PORT automatically, while local development falls back to 5000.
const PORT = process.env.PORT || 5000;

// Allow requests from the React frontend in both local development and Vercel production.
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.post('/api/webhooks/paystack', express.raw({ type: 'application/json' }), paystackWebhookHandler);
app.use(express.json());

// GET / confirms that the backend API is online and returns a simple status message.
app.get('/', (req, res) => {
  res.json({ message: 'Online invoicing API is running' });
});

// Health check endpoint used by Render to verify that the backend service is running.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/pay', payRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/reports', reportRoutes);

cron.schedule('0 8 * * *', sendOverdueReminders);

async function startServer() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
