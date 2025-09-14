const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { GMAIL_USER, GMAIL_PASS } = process.env;
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn('[MAILER] Missing GMAIL_USER or GMAIL_PASS env vars; emails will be logged only.');
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });
  return transporter;
}

async function sendOtpEmail(to, code) {
  const t = getTransporter();
  const subject = 'Your Budget Tracker Login OTP';
  const text = `Your one-time code is ${code}. It expires in 5 minutes. If you did not request this, ignore this email.`;
  if (!t) {
    console.log('[MAILER][DRYRUN] To:%s Subject:%s Body:%s', to, subject, text);
    return;
  }
  await t.sendMail({ from: process.env.GMAIL_USER, to, subject, text });
}

module.exports = { sendOtpEmail };
