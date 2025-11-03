const User = require("../models/user");
const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
const logger = require("../helpers/utils/logger");
const { generateToken } = require("../helpers/utils/jwt");
const { formatDate } = require("../helpers/utils/date");
const {
  OTP_EXPIRY_TIME,
  VENDOR_STATUS,
  ROLE,
  DELIVERY_PARTNER_STATUS,
} = require("../../config/constants/authConstant");

const HARDCODED_OTP = "123456";

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

  if (!user) {
    user = await User.create({
      mobNo,
      tempRegister: true,
      mobVerify: { code: HARDCODED_OTP, expireTime },
    });

    logger.info(`Registration OTP sent to ${mobNo}: ${HARDCODED_OTP}`);

    return messages.successResponse(
      {
        message: "OTP sent for registration",
        otp: HARDCODED_OTP,
        expireTime,
      },
      res,
      "OTP sent to your mobile number"
    );
  }

  // If user exists -> treat as login
  await User.findByIdAndUpdate(user._id, {
    mobVerify: { code: HARDCODED_OTP, expireTime },
  });

  logger.info(`Login OTP sent to ${mobNo}: ${HARDCODED_OTP}`);

  return messages.verificationOTP(
    {
      message: "OTP sent for login",
      otp: HARDCODED_OTP,
      expireTime,
    },
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

  await User.findByIdAndUpdate(user._id, {
    mobVerify: { code: HARDCODED_OTP, expireTime },
  });

  logger.info(`OTP resent to ${mobNo}: ${HARDCODED_OTP}`);

  return messages.verificationOTP(
    { message: "OTP resent successfully", otp: HARDCODED_OTP, expireTime },
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
