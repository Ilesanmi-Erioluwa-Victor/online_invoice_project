const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;

async function createOAuth2Transport() {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground",
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const accessTokenResponse = await oauth2Client.getAccessToken();
  const accessToken = accessTokenResponse.token;

  if (!accessToken) {
    throw new Error(
      "Failed to obtain Gmail OAuth2 access token. Check your credentials and refresh token.",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken,
    },
  });
}

function getFromAddress(displayName) {
  const user = process.env.EMAIL_USER;
  if (!user) {
    throw new Error("EMAIL_USER is not set.");
  }
  return `"${displayName || "Invoice System"}" <${user}>`;
}

function createMailTransport() {
  return {
    async sendMail(options) {
      const transporter = await createOAuth2Transport();
      return transporter.sendMail(options);
    },
  };
}

function getMailErrorMessage(error) {
  if (
    ["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(error.code) ||
    /timeout/i.test(error.message)
  ) {
    return "Email server connection timed out.";
  }
  if (["EAUTH", "EENVELOPE"].includes(error.code)) {
    return error.message;
  }
  return error.message || "Email delivery failed";
}

module.exports = {
  createMailTransport,
  getFromAddress,
  getMailErrorMessage,
};
