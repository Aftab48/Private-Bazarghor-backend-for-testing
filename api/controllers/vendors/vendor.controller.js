const {
  createVendor,
  getVendor,
  updateVendor,
} = require("../../services/auth");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const createVendorController = catchAsync(async (req, res) => {
  return await createVendor(req, res);
});

const VendorController = catchAsync(async (req, res) => {
  const userId = req.user;
  const user = await getVendor(userId);
  if (!user) {
    return messages.notFound("User not found", res);
  }
  return messages.successResponse(
    user,
    res,
    "Profile data fetched successfully"
  );
});

const updateVendorController = catchAsync(async (req, res) => {
  const userId = req.user;
  // pass along files + body
  return await updateVendor(userId, req.body, req.files, res);
});

module.exports = {
  createVendorController,
  VendorController,
  updateVendorController,
};
