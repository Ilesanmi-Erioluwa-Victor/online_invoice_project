const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function getFromAddress(displayName) {
  // Until you verify a domain, Resend only allows this sender address
  return `${displayName || "Invoice System"} <onboarding@resend.dev>`;
}

async function sendMail({ from, to, subject, html, attachments }) {
  const result = await resend.emails.send({
    from: from || getFromAddress(),
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content, // Buffer is accepted directly
    })),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

function createMailTransport() {
  // Returns a nodemailer-compatible shaped object so existing call sites don't break
  return {
    sendMail,
  };
}

function getMailErrorMessage(error) {
  if (/timeout/i.test(error.message)) {
    return "Email server connection timed out.";
  }
  return error.message || "Email delivery failed";
}

module.exports = {
  createMailTransport,
  getFromAddress,
  getMailErrorMessage,
};
