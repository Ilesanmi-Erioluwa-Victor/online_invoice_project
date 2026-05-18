# Online Invoicing and Billing System

A full-stack web application for freelancers and small businesses to create invoices, manage clients, track payments, and send professional invoice emails.

Built with React + Tailwind CSS (frontend), Node.js + Express + Prisma (backend), Supabase PostgreSQL (database), Paystack (payments), and Nodemailer (email).

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. Set up Supabase

- Go to <https://supabase.com> and create a free project.
- Go to **Project Settings > Database > Connection String**.
- Copy the **Transaction pooler** string. This is your `DATABASE_URL`.
- Append `?pgbouncer=true&connection_limit=1` to the end of `DATABASE_URL`.
- Copy the **Direct connection** string. This is your `DIRECT_URL`.

### 3. Configure backend environment

```bash
cd server
cp .env.example .env
```

Fill in all values in `.env`.

### 4. Configure frontend environment

```bash
cd client
echo "VITE_API_URL=http://localhost:5000" > .env
```

### 5. Install dependencies and start backend

```**bash**
cd server
npm install
node index.js
```

Tables are created automatically in Supabase on first run.

### 6. Install dependencies and start frontend

```bash
cd client
npm install
npm run dev
```

### 7. Open the app

<http://localhost:5173>

---

## Gmail App Password Setup

1. Go to your Google Account > Security.
2. Enable 2-Step Verification if it is not already enabled.
3. Go to Security > 2-Step Verification > App Passwords.
4. Generate a new app password for Mail.
5. Use that 16-character password as `EMAIL_PASS` in your `.env`.

For production, if the host cannot connect through Nodemailer's Gmail shortcut, add explicit SMTP variables in Render:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_16_character_app_password
```

The backend also supports `EMAIL_CONNECTION_TIMEOUT_MS`, `EMAIL_GREETING_TIMEOUT_MS`, and `EMAIL_SOCKET_TIMEOUT_MS` so failed mail connections return quickly instead of keeping the frontend waiting for a long time.

---

## Paystack Test Mode Setup

1. Go to <https://dashboard.paystack.com>.
2. Create a free account.
3. Go to Settings > API Keys.
4. Copy the test secret key, which starts with `sk_test_`.
5. Add it as `PAYSTACK_SECRET_KEY` in your `.env`.
6. Use this test card to simulate payments:

```text
Card Number: 4084 0840 8408 4081
Expiry: any future date
CVV: 408
OTP: 123456
```

---

## Production Deployment

### Backend — Render

1. Push your project to GitHub.
2. Go to <https://render.com> and sign up free.
3. Click New > Web Service.
4. Connect your GitHub repository.
5. Configure the service:
   - Root Directory: `server`
   - Build Command: `npm install && npx prisma generate && npx prisma db push`
   - Start Command: `node index.js`
6. Add all environment variables from `.env.example` in the Render dashboard under Environment.
7. Do not forget `CLIENT_URL`. Add it after deploying the frontend.
8. Click Deploy.
9. Copy your Render URL, for example `https://invoicing-backend.onrender.com`.

### Frontend — Vercel

1. Go to <https://vercel.com> and sign up free.
2. Click New Project and import your GitHub repository.
3. Configure the project:
   - Root Directory: `client`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:

```text
VITE_API_URL=https://your-invoicing-backend.onrender.com
```

Use your actual Render URL from the backend deployment step.

5. Click Deploy.
6. Copy your Vercel URL, for example `https://invoicing-app.vercel.app`.

### Final Steps After Both Are Deployed

1. Go to Render dashboard > your backend service > Environment.
2. Add `CLIENT_URL=https://your-app.vercel.app`.
3. Click Save. Render redeploys automatically.
4. Go to dashboard.paystack.com > Settings > Webhooks.
5. Add webhook URL:

```text
https://your-invoicing-backend.onrender.com/api/webhooks/paystack
```

Your app is now fully live end to end.

---

## Project Structure

```text
invoicing-app/
├── client/                  # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── pages/           # Login, Register, Dashboard, Invoices,
│   │   │                    # Clients, CreateInvoice, Reports, Profile,
│   │   │                    # PayInvoice
│   │   ├── components/      # Navbar, Sidebar, ProtectedRoute, StatusBadge
│   │   ├── context/         # AuthContext (global auth state)
│   │   └── api/             # axios.js (configured Axios instance)
│   ├── .env                 # Development environment variables
│   ├── .env.production      # Production environment variables
│   └── vercel.json          # Vercel routing config for React Router
│
├── server/                  # Node.js + Express + Prisma backend
│   ├── routes/              # auth, clients, invoices, reports, profile, pay
│   ├── middleware/          # auth.js (JWT verification)
│   ├── lib/                 # prisma.js (Prisma client singleton)
│   ├── db/                  # init.js (runs prisma db push on startup)
│   ├── utils/               # generateInvoicePDF, generateReceiptPDF,
│   │                        # sendReceipt, sendOverdueReminders
│   ├── prisma/
│   │   └── schema.prisma    # Prisma data models
│   ├── .env                 # Server environment variables
│   ├── .env.example         # Environment variable template
│   └── render.yaml          # Render deployment configuration
│
└── README.md
```

---

## Final Notes

- The backend uses Prisma ORM for all database access.
- Paystack remains in test mode throughout.
- All currency remains in Nigerian Naira.
- The project uses plain JavaScript, not TypeScript.
- No UI component library is used.
