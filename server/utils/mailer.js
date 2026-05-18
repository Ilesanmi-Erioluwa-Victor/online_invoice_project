const nodemailer = require('nodemailer');

const MAIL_TIMEOUTS = {
  connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 10000),
  greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 10000),
  socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 20000),
  dnsTimeout: Number(process.env.EMAIL_DNS_TIMEOUT_MS || 10000),
};

function getMailAuth() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Email is not configured. Set EMAIL_USER and EMAIL_PASS, or SMTP_USER and SMTP_PASS.');
  }

  return { user, pass };
}

function getFromAddress(displayName) {
  const auth = getMailAuth();
  return `"${displayName || 'Invoice System'}" <${auth.user}>`;
}

function createMailTransport() {
  const auth = getMailAuth();
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 465);

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth,
      family: 4,
      ...MAIL_TIMEOUTS,
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth,
    family: 4,
    ...MAIL_TIMEOUTS,
  });
}

function getMailErrorMessage(error) {
  if (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION'].includes(error.code) || /timeout/i.test(error.message)) {
    return 'Email server connection timed out. Check the production SMTP host, port, and network access.';
  }

  if (['EAUTH', 'EENVELOPE'].includes(error.code)) {
    return error.message;
  }

  return error.message || 'Email delivery failed';
}

module.exports = {
  createMailTransport,
  getFromAddress,
  getMailErrorMessage,
};
