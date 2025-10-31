// /api/services/email.service.js
const nodemailer = require("nodemailer");
const mjml = require("mjml");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email with given subject and HTML body
 */

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });
    logger.info(`📧 Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    logger.error("❌ Error sending email:", error);
    throw error;
  }
};

const renderTemplate = (template, data = {}) => {
  let html = template;
  for (const key in data) {
    const value = data[key] ?? "";
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return mjml(html, { minify: true }).html;
};

module.exports = { sendEmail, renderTemplate };
