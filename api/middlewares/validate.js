const util = require("../helpers/utils/messages");
const logger = require("../helpers/utils/logger");

const validate = (validator) => {
  return async function (req, res, next) {
    try {
      // For GET requests, validate query params; for others, validate body
      const dataToValidate = req.method === "GET" ? req.query : req.body;
      const validatedData = await validator.validateAsync(dataToValidate);
      
      // Assign validated data back to the appropriate location
      if (req.method === "GET") {
        req.query = validatedData;
      } else {
        req.body = validatedData;
      }
      next();
    } catch (err) {
      logger.error("Error - ValidationError", err);
      if (err.isJoi) return util.inValidParam(err?.message ?? err, res);
      next(util.failureResponse(err?.message ?? err, res));
    }
  };
};
module.exports = validate;
