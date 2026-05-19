const { google } = require('googleapis');

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return oauth2Client;
}

function getFromAddress(displayName) {
  const user = process.env.EMAIL_USER;
  if (!user) throw new Error('EMAIL_USER is not set.');
  return `"${displayName || 'Invoice System'}" <${user}>`;
}

// buildRawEmail constructs a base64url-encoded RFC 2822 email with optional PDF attachment.
function buildRawEmail({ from, to, subject, html, attachments }) {
  const boundary = `boundary_${Date.now()}`;
  const lines = [];

  lines.push(`From: ${from}`);
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${subject}`);
  lines.push('MIME-Version: 1.0');
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push('');
  lines.push(`--${boundary}`);
  lines.push('Content-Type: text/html; charset="UTF-8"');
  lines.push('');
  lines.push(html);

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      const base64Data = Buffer.isBuffer(attachment.content)
        ? attachment.content.toString('base64')
        : Buffer.from(attachment.content).toString('base64');

      lines.push(`--${boundary}`);
      lines.push(`Content-Type: application/pdf; name="${attachment.filename}"`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      lines.push('');
      lines.push(base64Data);
    }
  }

  lines.push(`--${boundary}--`);

  const raw = Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return raw;
}

async function sendMail({ from, to, subject, html, attachments }) {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const raw = buildRawEmail({ from, to, subject, html, attachments });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}

function createMailTransport() {
  return { sendMail };
}

function getMailErrorMessage(error) {
  if (
    ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION'].includes(error.code) ||
    /timeout/i.test(error.message)
  ) {
    return 'Email server connection timed out.';
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