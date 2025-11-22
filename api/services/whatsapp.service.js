// /api/services/whatsapp.service.js
const https = require("https");

/**
 * Normalize phone number to international format
 * Adds default country code (91 for India) if missing
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} - Normalized phone number in international format
 */
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error('Phone number is required and must be a string');
  }

  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, "");

  if (!cleaned) {
    throw new Error('Phone number cannot be empty after cleaning');
  }

  // Get default country code from environment or use 91 (India) as default
  const defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";

  // Check if number already starts with a country code
  // Indian numbers: if it starts with 91 and has 12-13 digits, it already has country code
  // If it's 10 digits, it's a local number without country code
  // If it's 11-13 digits and doesn't start with 91, it might have a different country code
  
  // If number is 10 digits, add default country code
  if (cleaned.length === 10) {
    cleaned = defaultCountryCode + cleaned;
    logger.info(`📱 Added country code ${defaultCountryCode} to phone number. Normalized: ${cleaned}`);
  }
  // If number is 11-12 digits and starts with default country code, it's already normalized
  else if (cleaned.length >= 11 && cleaned.startsWith(defaultCountryCode)) {
    // Already has country code, use as is
    logger.info(`📱 Phone number already has country code. Using: ${cleaned}`);
  }
  // If number is 11-13 digits but doesn't start with default country code, assume it has a different country code
  else if (cleaned.length >= 11 && cleaned.length <= 15) {
    // Assume it already has a country code (different from default)
    logger.info(`📱 Phone number appears to have a country code. Using: ${cleaned}`);
  }
  // If number is less than 10 digits, it's invalid
  else if (cleaned.length < 10) {
    throw new Error(`Invalid phone number length: ${cleaned.length} digits. Minimum 10 digits required.`);
  }
  // If number is more than 15 digits, it's invalid (E.164 max length)
  else if (cleaned.length > 15) {
    throw new Error(`Invalid phone number length: ${cleaned.length} digits. Maximum 15 digits allowed.`);
  }

  return cleaned;
};

/**
 * Send WhatsApp message using Facebook Graph API
 * @param {string} to - Phone number in international format (e.g., "919903776046")
 * @param {string} templateName - Name of the WhatsApp template (e.g., "hello_world")
 * @param {string} languageCode - Language code (e.g., "en_US")
 * @param {Object} templateParams - Optional template parameters
 * @returns {Promise<boolean>}
 */
const sendWhatsApp = async (to, templateName, languageCode = "en_US", templateParams = {}) => {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "867474066444801";
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";

    if (!accessToken) {
      logger.warn("⚠️ WhatsApp access token not configured. Skipping WhatsApp notification.");
      return false;
    }

    if (!to) {
      logger.warn("⚠️ WhatsApp recipient number not provided. Skipping WhatsApp notification.");
      return false;
    }

    // Normalize phone number (add country code if missing)
    let formattedTo;
    try {
      formattedTo = normalizePhoneNumber(to);
    } catch (error) {
      logger.error(`❌ Error normalizing phone number "${to}":`, error.message);
      throw new Error(`Invalid phone number format: ${error.message}`);
    }

    // Build template payload
    const templatePayload = {
      name: templateName,
      language: {
        code: languageCode,
      },
    };

    // Add template parameters if provided
    if (Object.keys(templateParams).length > 0) {
      templatePayload.components = [
        {
          type: "body",
          parameters: Object.entries(templateParams).map(([key, value]) => ({
            type: "text",
            text: String(value),
          })),
        },
      ];
    }

    const payload = JSON.stringify({
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "template",
      template: templatePayload,
    });

    const options = {
      hostname: "graph.facebook.com",
      path: `/${apiVersion}/${phoneNumberId}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    // Log request details for debugging
    logger.info(`📤 Sending WhatsApp template message:`, {
      to: formattedTo,
      template: templateName,
      path: options.path,
      phoneNumberId: phoneNumberId,
    });

    return new Promise((resolve, reject) => {
      const timeout = 15000; // 15 seconds timeout for WhatsApp API
      let req;
      
      const timeoutId = setTimeout(() => {
        if (req) req.destroy();
        logger.error(`❌ WhatsApp API request timeout after ${timeout}ms`);
        reject(new Error(`WhatsApp API request timeout after ${timeout}ms`));
      }, timeout);

      req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          clearTimeout(timeoutId);
          
          // Log full response for debugging
          logger.info(`📥 WhatsApp API Response (Template):`, {
            statusCode: res.statusCode,
            body: data,
          });
          
          // Also log the parsed response for easier reading
          try {
            const parsedResponse = JSON.parse(data || "{}");
            logger.info(`📥 WhatsApp API Response (parsed):`, JSON.stringify(parsedResponse, null, 2));
            
            // Check for message ID in response (indicates successful send)
            if (parsedResponse.messages && parsedResponse.messages[0] && parsedResponse.messages[0].id) {
              logger.info(`✅ WhatsApp message ID: ${parsedResponse.messages[0].id}`);
            }
          } catch (e) {
            logger.warn(`⚠️ Could not parse WhatsApp response:`, e.message);
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const responseData = JSON.parse(data || "{}");
              
              // Check if message was actually accepted
              if (responseData.messages && responseData.messages[0] && responseData.messages[0].id) {
                logger.info(`📱 WhatsApp template message sent successfully to ${formattedTo}`, {
                  messageId: responseData.messages[0].id,
                  status: responseData.messages[0].message_status
                });
                resolve(true);
              } else {
                logger.warn(`⚠️ WhatsApp API returned success but no message ID. Response:`, responseData);
                resolve(true); // Still consider it success if status is 2xx
              }
            } catch (parseError) {
              logger.warn(`⚠️ Could not parse WhatsApp response, but status was ${res.statusCode}`);
              resolve(true); // Still consider it success if status is 2xx
            }
          } else {
            let errorData;
            try {
              errorData = JSON.parse(data || "{}");
            } catch (parseError) {
              errorData = { raw: data, parseError: parseError.message };
            }
            
            const errorMessage = errorData.error?.message || errorData.error?.error_user_msg || errorData.message || "Unknown error";
            const errorCode = errorData.error?.code || errorData.error?.error_subcode || "UNKNOWN";
            
            logger.error(`❌ Error sending WhatsApp message:`, {
              statusCode: res.statusCode,
              errorCode: errorCode,
              errorMessage: errorMessage,
              fullError: errorData,
            });
            
            reject(new Error(`WhatsApp API error (${res.statusCode}): ${errorMessage} [Code: ${errorCode}]`));
          }
        });
      });

      req.on("error", (error) => {
        clearTimeout(timeoutId);
        logger.error("❌ Network error sending WhatsApp message:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        reject(error);
      });

      // Log the payload being sent (without sensitive token)
      logger.debug(`📤 WhatsApp request payload:`, JSON.parse(payload));

      req.write(payload);
      req.end();
    });
  } catch (error) {
    logger.error("❌ Error in sendWhatsApp function:", error);
    throw error;
  }
};

/**
 * Send WhatsApp message with custom text (for non-template messages)
 * Note: This requires the recipient to have initiated a conversation first
 * @param {string} to - Phone number in international format
 * @param {string} message - Message text
 * @returns {Promise<boolean>}
 */
const sendWhatsAppText = async (to, message) => {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "867474066444801";
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";

    if (!accessToken) {
      logger.warn("⚠️ WhatsApp access token not configured. Skipping WhatsApp notification.");
      return false;
    }

    if (!to || !message) {
      logger.warn("⚠️ WhatsApp recipient or message not provided. Skipping WhatsApp notification.");
      return false;
    }

    // Normalize phone number (add country code if missing)
    let formattedTo;
    try {
      formattedTo = normalizePhoneNumber(to);
    } catch (error) {
      logger.error(`❌ Error normalizing phone number "${to}":`, error.message);
      throw new Error(`Invalid phone number format: ${error.message}`);
    }

    const payload = JSON.stringify({
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "text",
      text: {
        body: message,
      },
    });

    const options = {
      hostname: "graph.facebook.com",
      path: `/${apiVersion}/${phoneNumberId}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    // Log request details for debugging
    logger.info(`📤 Sending WhatsApp text message:`, {
      to: formattedTo,
      messageLength: message.length,
      path: options.path,
      phoneNumberId: phoneNumberId,
    });

    return new Promise((resolve, reject) => {
      const timeout = 15000; // 15 seconds timeout for WhatsApp API
      let req;
      
      const timeoutId = setTimeout(() => {
        if (req) req.destroy();
        logger.error(`❌ WhatsApp API request timeout after ${timeout}ms`);
        reject(new Error(`WhatsApp API request timeout after ${timeout}ms`));
      }, timeout);

      req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          clearTimeout(timeoutId);
          
          // Log full response for debugging
          logger.info(`📥 WhatsApp API Response:`, {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });

          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const responseData = JSON.parse(data || "{}");
              logger.info(`📱 WhatsApp text message sent successfully to ${formattedTo}`, responseData);
              resolve(true);
            } catch (parseError) {
              logger.warn(`⚠️ Could not parse WhatsApp response, but status was ${res.statusCode}`);
              resolve(true); // Still consider it success if status is 2xx
            }
          } else {
            let errorData;
            try {
              errorData = JSON.parse(data || "{}");
            } catch (parseError) {
              errorData = { raw: data, parseError: parseError.message };
            }
            
            const errorMessage = errorData.error?.message || errorData.error?.error_user_msg || errorData.message || "Unknown error";
            const errorCode = errorData.error?.code || errorData.error?.error_subcode || "UNKNOWN";
            
            logger.error(`❌ Error sending WhatsApp text message:`, {
              statusCode: res.statusCode,
              errorCode: errorCode,
              errorMessage: errorMessage,
              fullError: errorData,
            });
            
            reject(new Error(`WhatsApp API error (${res.statusCode}): ${errorMessage} [Code: ${errorCode}]`));
          }
        });
      });

      req.on("error", (error) => {
        clearTimeout(timeoutId);
        logger.error("❌ Network error sending WhatsApp text message:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        reject(error);
      });

      // Log the payload being sent (without sensitive token)
      logger.debug(`📤 WhatsApp request payload:`, JSON.parse(payload));

      req.write(payload);
      req.end();
    });
  } catch (error) {
    logger.error("❌ Error in sendWhatsAppText function:", error);
    throw error;
  }
};

module.exports = { sendWhatsApp, sendWhatsAppText };

