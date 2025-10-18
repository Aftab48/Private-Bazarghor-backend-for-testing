const util = require("../helpers/utils/messages");

const validate = (validator) => {
  return async function (req, res, next) {
    try {
      req.body = await validator.validateAsync(req.body);
      next();
    } catch (err) {
      logger.error("Error - ValidationError", err);
      if (err.isJoi) return util.inValidParam(err?.message ?? err, res);
      next(util.failureResponse(err?.message ?? err, res));
    }
  };
};
module.exports = validate;
