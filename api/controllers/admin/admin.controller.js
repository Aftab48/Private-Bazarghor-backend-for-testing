const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");
const adminServices = require("../../services/auth");

const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminServices.adminLoginService(
    email,
    password,
    req.headers["user-agent"]
  );

  if (result.success)
    return messages.loginSuccess(result.data, res, {
      message: "Admin logged in successfully",
    });
  if (result.validation)
    return messages.insufficientParameters(res, result.error);
  if (result.notFound) return messages.recordNotFound(res, result.error);
  if (result.forbidden) return messages.wrongPassword(res, result.error);

  return messages.internalServerError(res, { message: result.error });
});

const forgotPasswordController = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await adminServices.forgotPassword(email);

  if (result.success) return messages.resetPasswordOtpSend(res, result.data);
  if (result.validation)
    return messages.insufficientParameters(res, result.error);
  if (result.notFound) return messages.recordNotFound(res, result.error);
  if (result.forbidden) return messages.forbidden(res, result.error);

  return messages.internalServerError(res, { message: result.error });
});

const resetPasswordController = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await adminServices.resetPassword(email, otp, newPassword);

  if (result.success) return messages.changePasswordResponse(res, result.data);
  if (result.validation)
    return messages.insufficientParameters(res, result.error);
  if (result.notFound) return messages.recordNotFound(res, result.error);
  if (result.forbidden) return messages.forbidden(res, result.error);

  return messages.internalServerError(res, { message: result.error });
});

const changeAdminPassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user;

  const result = await adminServices.changePassword(
    userId,
    oldPassword,
    newPassword
  );

  if (result.success) return messages.changePasswordResponse(res, result.data);
  if (result.validation)
    return messages.insufficientParameters(res, result.error);
  if (result.notFound) return messages.recordNotFound(res, result.error);
  if (result.forbidden) return messages.wrongPassword(res, result.error);

  return messages.internalServerError(res, { message: result.error });
});

const getAdminsController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await adminServices.getAdmins(userId);

  if (result?.notFound) {
    return messages.notFound("User not found", res);
  }
  return messages.successResponse(
    result.data,
    res,
    "Profile data fetched successfully"
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
      result?.data,
      res,
      "Profile updated successfully"
    );
  } else if (result?.notFound) {
    return messages.recordNotFound(res, result.error);
  } else {
    return messages.failureResponse(result.error || "Update failed", res);
  }
});

module.exports = {
  adminLogin,
  changeAdminPassword,
  forgotPasswordController,
  resetPasswordController,
  getAdminsController,
  updateAdminController,
};
