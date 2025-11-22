// /api/services/email.service.js
const nodemailer = require("nodemailer");
const mjml2html = require("mjml");
const { sendWhatsApp, sendWhatsAppText } = require("./whatsapp.service");

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

/**
 * Send both email and WhatsApp notification
 * @param {string} email - Email address
 * @param {string} phoneNumber - Phone number in international format (optional)
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {Object} whatsappOptions - WhatsApp options { templateName, languageCode, templateParams, message }
 * @returns {Promise<Object>} - Returns { emailSent, whatsappSent }
 */
const sendNotification = async (
  email,
  phoneNumber,
  subject,
  html,
  whatsappOptions = {}
) => {
  const results = { emailSent: false, whatsappSent: false };

  // Send email
  if (email) {
    try {
      results.emailSent = await sendEmail(email, subject, html);
    } catch (error) {
      logger.error("❌ Failed to send email notification:", error);
      // Don't throw, continue with WhatsApp
    }
  }

  // Send WhatsApp
  if (phoneNumber) {
    logger.info(`📱 Attempting to send WhatsApp to: ${phoneNumber}`);
    try {
      if (whatsappOptions.templateName) {
        // Use template message (preferred - doesn't require prior conversation)
        logger.info(`📱 Using template: ${whatsappOptions.templateName}`);
        try {
          results.whatsappSent = await sendWhatsApp(
            phoneNumber,
            whatsappOptions.templateName,
            whatsappOptions.languageCode || "en_US",
            whatsappOptions.templateParams || {}
          );
        } catch (templateError) {
          logger.warn(
            `⚠️ Template message failed, trying text message fallback:`,
            templateError.message
          );
          // Fallback to text message if template fails
          if (whatsappOptions.message) {
            logger.info(
              `📱 Using text message fallback (length: ${whatsappOptions.message.length})`
            );
            logger.warn(
              `⚠️ Note: Text messages require recipient to have messaged you first (24-hour window)`
            );
            results.whatsappSent = await sendWhatsAppText(
              phoneNumber,
              whatsappOptions.message
            );
          } else {
            throw templateError; // Re-throw if no fallback message
          }
        }
      } else if (whatsappOptions.message) {
        // Use text message (requires prior conversation)
        logger.info(
          `📱 Using text message (length: ${whatsappOptions.message.length})`
        );
        logger.warn(
          `⚠️ Note: Text messages require recipient to have messaged you first (24-hour window)`
        );
        results.whatsappSent = await sendWhatsAppText(
          phoneNumber,
          whatsappOptions.message
        );
      } else {
        // Default: try to send a simple text message with subject
        const defaultMessage = subject || "Notification from BazarGhorr";
        logger.info(`📱 Using default message: ${defaultMessage}`);
        logger.warn(
          `⚠️ Note: Text messages require recipient to have messaged you first (24-hour window)`
        );
        results.whatsappSent = await sendWhatsAppText(
          phoneNumber,
          defaultMessage
        );
      }
      logger.info(`✅ WhatsApp send result: ${results.whatsappSent}`);
    } catch (error) {
      logger.error("❌ Failed to send WhatsApp notification:", {
        error: error.message,
        stack: error.stack,
        phoneNumber: phoneNumber,
      });
      // Don't throw, email might have succeeded
    }
  } else {
    logger.warn(
      `⚠️ No phone number provided for WhatsApp notification. Email: ${email}`
    );
  }

  return results;
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
      logger.warn(
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
      logger.error("MJML rendering errors:", errors);
    }

    return html;
  } catch (err) {
    logger.error("renderTemplate error:", err);
    throw err;
  }
}

module.exports = { sendEmail, renderTemplate, sendNotification };
