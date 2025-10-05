const {
  RESPONSE_CODE,
} = require("../../../config/constants/responseCodeConstant");
const responseCode = require("../utils/responseCode");
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error(err.message);
    res.status(responseCode.internalServerError).json({
      code: RESPONSE_CODE.ERROR,
      message: err.message,
      data: {},
    });
  });
};

module.exports = catchAsync;
