// /api/services/email.service.js
const nodemailer = require("nodemailer");
const mjml2html = require("mjml");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

function replacePlaceholders(template, data) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = data[key.trim()];
    return value !== undefined && value !== null ? value : "";
  });
}

function renderTemplate(template, data = {}) {
  const filledTemplate = replacePlaceholders(template, data);
  const { html, errors } = mjml2html(filledTemplate, { beautify: true });

  if (errors && errors.length) {
    console.error("MJML rendering errors:", errors);
  }

  return html;
}

module.exports = { sendEmail, renderTemplate };
