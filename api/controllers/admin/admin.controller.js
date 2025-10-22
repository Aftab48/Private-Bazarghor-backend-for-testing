const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");
const { adminLoginService } = require("../../services/auth");

/**
 * Admin Login Controller
 */
const adminLogin = catchAsync(async (req, res) => {
  await adminLoginService(req, res);
});
module.exports = {
  adminLogin,
};  