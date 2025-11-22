const User = require("../models/user");
const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
const { generateToken } = require("../helpers/utils/jwt");
const { formatDate } = require("../helpers/utils/date");
const { generateOtp } = require("../helpers/utils/comman");
const { sendOtpSms } = require("./twilio.service");
const {
  OTP_EXPIRY_TIME,
  VENDOR_STATUS,
  ROLE,
  DELIVERY_PARTNER_STATUS,
} = require("../../config/constants/authConstant");

const sendOTP = catchAsync(async (req, res) => {
  const { mobNo } = req.body;

  if (!mobNo) {
    return messages.insufficientParameters(res, "Mobile number required");
  }

  let user = await User.findOne({ mobNo }).lean();
  if (user?.isActive === false) {
    return messages.forbidden(
      "Your account is deactivated. Please contact support.",
      res
    );
  }

  const expireDate = new Date();
  expireDate.setMinutes(expireDate.getMinutes() + OTP_EXPIRY_TIME.MINUTE);
  const expireTime = formatDate(expireDate);
  const otp = generateOtp(user?.mobVerify?.code);

  if (!user) {
    user = await User.create({
      mobNo,
      tempRegister: true,
      mobVerify: { code: otp, expireTime },
    });

    console.log(`OTP sent to ${mobNo}: ${otp}`);

    try {
      await sendOtpSms(mobNo, otp);
    } catch (err) {
      logger.error(`Failed to send registration OTP to ${mobNo}`, err);
      return messages.internalServerError(
        res,
        "Failed to send OTP. Please try again."
      );
    }

    const payload = {
      message: "OTP sent for registration",
      expireTime,
      otp, //for testing purposes
    };
    if (process.env.NODE_ENV !== "Development") payload.otp = otp;

    return messages.successResponse(
      payload,
      res,
      "OTP sent to your mobile number"
    );
  }

  await User.findByIdAndUpdate(user._id, {
    mobVerify: { code: otp, expireTime: formatDate(expireTime) },
  });

  console.log(`OTP sent to ${mobNo}: ${otp}`);

  try {
    await sendOtpSms(mobNo, otp);
  } catch (err) {
    logger.error(`Failed to send login OTP to ${mobNo}`, err);
    return messages.internalServerError(
      res,
      "Failed to send OTP. Please try again."
    );
  }

  return messages.verificationOTP(
    { message: "OTP sent for login", otp, expireTime: formatDate(expireTime) },
    res,
    "OTP sent to your mobile number"
  );
});

const verifyOTPForRegistration = catchAsync(async (req, res) => {
  const { mobNo, otp } = req.body;

  if (!mobNo || !otp) {
    return messages.insufficientParameters(
      res,
      "Mobile number and OTP required"
    );
  }

  const user = await User.findOne({ mobNo }).lean();
  if (!user) return messages.recordNotFound(res, "User not found");

  if (
    !user.mobVerify ||
    user.mobVerify.code !== otp ||
    new Date() > new Date(user.mobVerify.expireTime)
  ) {
    return messages.badRequest({}, res, "Invalid or expired OTP");
  }

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: { mobVerifiedAt: formatDate(new Date()) },
      $unset: { mobVerify: "" },
    },
    { new: true }
  );

  return messages.loginOtpVerified(
    { mobNo },
    res,
    "Mobile number verified successfully"
  );
});

const verifyOTPAndLogin = catchAsync(async (req, res) => {
  const { mobNo, otp, deviceDetail } = req.body;

  if (!mobNo || !otp) {
    return messages.insufficientParameters(
      res,
      "Mobile number and OTP required"
    );
  }

  const user = await User.findOne({ mobNo }).lean();
  if (!user) return messages.recordNotFound(res, "User not found");

  if (
    !user.mobVerify ||
    user.mobVerify.code !== otp ||
    new Date() > new Date(user.mobVerify.expireTime)
  ) {
    return messages.badRequest({}, res, "Invalid or expired OTP");
  }
  const roleCodes = user.roles?.map((r) => r.code) || [];

  if (
    roleCodes.includes(ROLE.VENDOR) ||
    roleCodes.includes(ROLE.DELIVERY_PARTNER)
  ) {
    const sts = user.status;

    if (roleCodes.includes(ROLE.VENDOR)) {
      if (sts === VENDOR_STATUS.PENDING) {
        return messages.forbidden(
          "Your vendor account is pending approval. Please wait for admin verification.",
          res
        );
      }
      if (sts !== VENDOR_STATUS.APPROVED) {
        return messages.forbidden(
          "Your vendor account is not approved. Please contact support.",
          res
        );
      }
    }
    if (roleCodes.includes(ROLE.DELIVERY_PARTNER)) {
      if (sts === DELIVERY_PARTNER_STATUS.PENDING) {
        return messages.forbidden(
          "Your delivery partner account is pending approval. Please wait for admin verification.",
          res
        );
      }
      if (sts !== DELIVERY_PARTNER_STATUS.APPROVED) {
        return messages.forbidden(
          "Your delivery partner account is not approved. Please contact support.",
          res
        );
      }
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $unset: { mobVerify: "" },
      $set: { lastLogin: new Date() },
    },
    { new: true }
  ).lean();

  const tokenData = await generateToken(updatedUser, deviceDetail);
  return messages.loginOtpVerified(
    {
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        mobNo: updatedUser.mobNo,
        roles: updatedUser.roles,
        lastLogin: formatDate(updatedUser.lastLogin),
      },
      token: tokenData.token,
      refreshToken: tokenData.refreshToken,
      validateTill: tokenData.validateTill,
    },
    res,
    "Login successful"
  );
});

const resendOTP = catchAsync(async (req, res) => {
  const { mobNo } = req.body;
  if (!mobNo) {
    return messages.insufficientParameters(res, "Mobile number required");
  }

  const user = await User.findOne({ mobNo }).lean();
  if (!user) {
    return messages.recordNotFound(res, "User not found");
  }

  const expireDate = new Date();
  expireDate.setMinutes(expireDate.getMinutes() + OTP_EXPIRY_TIME.MINUTE);
  const expireTime = formatDate(expireDate);

  const otp = generateOtp(user?.mobVerify?.code);
  await User.findByIdAndUpdate(user._id, {
    mobVerify: { code: otp, expireTime },
  });

  console.log(`OTP resent to ${mobNo}: ${otp}`);

  try {
    await sendOtpSms(mobNo, otp);
  } catch (err) {
    logger.error(`Failed to resend OTP to ${mobNo}`, err);
    return messages.internalServerError(
      res,
      "Failed to resend OTP. Please try again."
    );
  }

  return messages.verificationOTP(
    { message: "OTP resent successfully" },
    res,
    "OTP resent successfully"
  );
});

module.exports = {
  sendOTP,
  verifyOTPForRegistration,
  verifyOTPAndLogin,
  resendOTP,
};
