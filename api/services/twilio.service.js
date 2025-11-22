const twilio = require("twilio");
const { OTP_EXPIRY_TIME } = require("../../config/constants/authConstant");

let twilioClient = null;
try {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  if (twilioSid && twilioToken) {
    twilioClient = twilio(twilioSid, twilioToken);
  } else {
    logger.warn(
      "Twilio credentials not set. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to enable SMS."
    );
  }
} catch (e) {
  logger.error("Failed to initialize Twilio client", e);
}

const ensureE164 = (mobNo) => {
  if (!mobNo) return mobNo;
  const trimmed = String(mobNo).trim();
  if (trimmed.startsWith("+")) return trimmed.replace(/\s+/g, "");

  const digits = trimmed.replace(/\D/g, "");
  const rawDefault = process.env.TWILIO_DEFAULT_COUNTRY_CODE || "+91";
  const defaultCc =
    (rawDefault || "+91").replace(/\s+/g, "").replace(/^\+/, "") || "91";

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length === 12 && digits.startsWith(defaultCc)) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+${defaultCc}${digits}`;
  }
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  return trimmed;
};

const sendOtpSms = async (mobNo, code) => {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = ensureE164(mobNo);
  const minutes = Number(OTP_EXPIRY_TIME?.MINUTE || 5);
  const body = `Your verification code is ${code}. Expires in ${minutes} min.`;

  if (!twilioClient) {
    logger.warn(
      `Twilio client not configured. Skipping SMS send to ${to}. OTP: ${code}`
    );
    return;
  }

  const params = { body, to };
  if (messagingServiceSid) params.messagingServiceSid = messagingServiceSid;
  else if (from) params.from = from;
  else {
    logger.error(
      "Twilio sender not configured. Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER."
    );
    throw new Error("SMS_SENDER_NOT_CONFIGURED");
  }

  const resp = await twilioClient.messages.create(params);
  logger.info(`OTP SMS sent to ${to}. Twilio SID: ${resp.sid}`);
};

module.exports = { sendOtpSms, ensureE164 };
