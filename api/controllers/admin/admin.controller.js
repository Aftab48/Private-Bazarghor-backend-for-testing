const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");
const {
  adminLoginService,
  changePassword,
  resetPassword,
  forgotPassword,
  getAdmins,
  updateAdmin,
} = require("../../services/auth");

const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminLoginService(
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

  const result = await forgotPassword(email);

  if (result.success) return messages.resetPasswordOtpSend(res, result.data);
  if (result.validation)
    return messages.insufficientParameters(res, result.error);
  if (result.notFound) return messages.recordNotFound(res, result.error);
  if (result.forbidden) return messages.forbidden(res, result.error);

  return messages.internalServerError(res, { message: result.error });
});

const resetPasswordController = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const result = await resetPassword(email, otp, newPassword);

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

  const result = await changePassword(userId, oldPassword, newPassword);

  if (result.success) return messages.changePasswordResponse(res, result.data);
  if (result.validation)
    return messages.insufficientParameters(res, result.error);
  if (result.notFound) return messages.recordNotFound(res, result.error);
  if (result.forbidden) return messages.wrongPassword(res, result.error);

  return messages.internalServerError(res, { message: result.error });
});

const getAdminsController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await getAdmins(userId);

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
  const userId = req.user;
  console.log("userId: ", userId);
  const result = await updateAdmin(userId, req.body, req.files);

  if (result?.success) {
    return messages.successResponse(
      result?.data,
      res,
      "Profile updated successfully"
    );
  } else if (result?.data) {
    return messages.recordNotFound(res, "User not found");
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
