const responseStatusCode = require("./responseCode");
const {
  RESPONSE_CODE,
} = require("../../../config/constants/responseCodeConstant");

exports.unAuthenticated = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.unAuthorized).json({
    code: RESPONSE_CODE.UNAUTHENTICATED,
    message: res.message,
    data: {},
  });
};

exports.successResponse = (data, res, message) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.DEFAULT,
    message: message || res.message,
    data: data,
  });
};

exports.linkInvalid = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode?.validationError).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};

exports.changePasswordResponse = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.DEFAULT,
    message: res.message,
    data: {},
  });
};

exports.wrongPassword = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};

exports.updateProfileResponse = (data, res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.DEFAULT,
    message: res.message,
    data: data,
  });
};

exports.failureResponse = (data, res) => {
  let i = 0;
  if (data.name === "ValidationError") {
    Object.keys(data.errors).forEach((key) => {
      if (i !== 1) {
        data.message = data.errors[key].message;
      }
      i++;
    });
  }
  res.message = data.message;
  return res.status(responseStatusCode.validationError).json({
    code: RESPONSE_CODE.ERROR,
    message: data.message ? data.message : data,
  });
};

exports.badRequest = (data, res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.validationError).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: data,
  });
};

exports.recordNotFound = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.DEFAULT,
    message: res.message,
    data: {},
  });
};
exports.insufficientParameters = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.badRequest).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};
exports.notFound = (err, res) => {
  return res.status(responseStatusCode.notFound).json({
    code: RESPONSE_CODE.DEFAULT,
    message: err,
    data: {},
  });
};
exports.inValidParam = (message, res) => {
  message = message.replace(/\"/g, "");
  res.message = message;
  return res.status(responseStatusCode.validationError).json({
    code: RESPONSE_CODE.ERROR,
    message: message,
    data: {},
  });
};
exports.unAuthorizedRequest = (message, res) => {
  return res.status(responseStatusCode.unAuthorized).json({
    code: RESPONSE_CODE.ERROR,
    message: message,
    data: {},
  });
};
exports.loginSuccess = async (result, res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.LOGIN,
    message: res.message,
    data: result,
  });
};
exports.verificationOTP = (result, res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.OTP,
    message: res.message,
    data: result.token ? result : { message: result },
  });
};
exports.passwordEmailWrong = (res) => {
  return res.status(responseStatusCode.unAuthorized).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};
exports.passwordNotSet = (res) => {
  return res.status(responseStatusCode.unAuthorized).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};
exports.loginFailed = (error, res) => {
  res.message = error.message;
  return res.status(responseStatusCode.validationError).json({
    code: RESPONSE_CODE.ERROR,
    message: error.message,
    data: {},
  });
};
exports.userNotFound = (res) => {
  return res.status(responseStatusCode.validationError).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};
exports.logoutSuccessfull = (result, res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.DEFAULT,
    message: res.message,
    data: result,
  });
};
exports.changePasswordFailResponse = (res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};
exports.loginOtpVerified = (data, res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.OTP,
    message: res.message,
    data: data,
  });
};
exports.loginOtpVerificationFailed = (res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};
exports.loginWithAzureFailed = (res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
    data: {},
  });
};
exports.successListResponse = (result, res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.DEFAULT,
    message: result.message,
    data: result.data,
    paginator: result.paginator,
  });
};
exports.loginApiUserFailed = (res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
  });
};

exports.updateDocumentResponse = (data, res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.DEFAULT,
    message: res.message,
    data: data,
  });
};

exports.accountNotVerified = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.NOT_VERIFIED,
    message: res.message,
  });
};

exports.credentialsExists = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.duplicateRecord).json({
    code: RESPONSE_CODE.DUPLICATE,
    message: res.message,
  });
};

exports.internalServerError = (res, message) => {
  if (message) res.message = message;
  return res.status(responseStatusCode.internalServerError).json({
    code: RESPONSE_CODE.ERROR,
    message: res.message,
  });
};
exports.forbidden = (message, res) => {
  return res.status(responseStatusCode.forbidden).json({
    code: RESPONSE_CODE.ERROR,
    message: message,
    data: {},
  });
};
exports.clientNotFound = (message, res) => {
  return res.status(responseStatusCode.forbidden).json({
    code: RESPONSE_CODE.INVALID_CLIENT,
    message: message,
  });
};

exports.clientNotExist = (message, res) => {
  return res.status(responseStatusCode.success).json({
    code: RESPONSE_CODE.INVALID_CLIENT,
    message: message,
  });
};

exports.clientError = (res) => {
  return res.status(responseStatusCode.validationError).json({
    code: RESPONSE_CODE.FAILURE,
    message: res.message,
  });
};
