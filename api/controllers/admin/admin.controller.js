const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");
const adminServices = require("../../services/auth.service");

const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminServices.adminLoginService(
    email,
    password,
    req.headers["user-agent"]
  );
  if (result?.success) {
    return messages.loginSuccess(
      result.data,
      res,
      "Admin logged in successfully"
    );
  }
  return messages.failureResponse(result.error || "Admin login failed", res);
});

const forgotPasswordController = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await adminServices.forgotPassword(email);
  if (result?.success) {
    const msg = result.data?.message || "Reset password OTP sent successfully";
    return messages.resetPasswordOtpSend(res, msg, result.data);
  }
  return messages.failureResponse(
    result.error || "Forgot password failed",
    res
  );
});

const resetPasswordController = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await adminServices.resetPassword(email, otp, newPassword);
  if (result?.success) {
    const msg = result.data?.message || "Password reset successfully";
    return messages.changePasswordResponse(res, msg);
  }
  return messages.failureResponse(result.error || "Reset password failed", res);
});

const changeAdminPassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user;
  const result = await adminServices.changePassword(
    userId,
    oldPassword,
    newPassword
  );
  if (result?.success) {
    const msg = result.data?.message || "Password changed successfully";
    return messages.changePasswordResponse(res, msg);
  }
  return messages.failureResponse(
    result.error || "Change password failed",
    res
  );
});

const getAdminsController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await adminServices.getAdmins(userId);
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Profile data fetched successfully"
    );
  }
  return messages.failureResponse(
    result.error || "Get admin profile failed",
    res
  );
});

const updateAdminController = catchAsync(async (req, res) => {
  const targetUserId = req.params.id;
  const result = await adminServices.updateAdmin(
    targetUserId,
    req.body,
    req.files,
    req.user
  );
  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Profile updated successfully"
    );
  }
  return messages.failureResponse(result.error || "Update admin failed", res);
});

module.exports = {
  adminLogin,
  changeAdminPassword,
  forgotPasswordController,
  resetPasswordController,
  getAdminsController,
  updateAdminController,
};
