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

function replacePlaceholders(templateStr, data = {}) {
  if (typeof templateStr !== "string") return templateStr;

  return templateStr.replace(/{{\s*(.*?)\s*}}/g, (_, key) => {
    const path = key
      .split(".")
      .map((k) => k.trim())
      .filter(Boolean);
    let value = data;
    for (const p of path) {
      if (value == null) break;
      value = value[p];
    }
    if (value !== undefined && value !== null && typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return value !== undefined && value !== null ? String(value) : "";
  });
}

function renderTemplate(template, data = {}) {
  try {
    let mjml;
    if (typeof template === "function") {
      mjml = template(data);
      if (typeof mjml !== "string") {
        mjml = String(mjml || "");
      }
    } else if (typeof template === "string") {
      mjml = replacePlaceholders(template, data);
    } else {
      console.warn(
        "renderTemplate received non-string, non-function template. Coercing to string.",
        {
          templateType: typeof template,
          template,
        }
      );
      mjml = String(template || "");
      mjml = replacePlaceholders(mjml, data);
    }

    const { html, errors } = mjml2html(mjml, { beautify: true });

    if (errors && errors.length) {
      console.error("MJML rendering errors:", errors);
    }

    return html;
  } catch (err) {
    console.error("renderTemplate error:", err);
    throw err;
  }
}

module.exports = { sendEmail, renderTemplate };
