const messages = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const {
  createDeliveryPartner,
  getDeliveryPartner,
  updateDeliveryPartner,
} = require("../../services/auth");

const registerDeliveryPartnerController = catchAsync(async (req, res) => {
  return await createDeliveryPartner(req, res);
});

const getDeliveryPartnerController = catchAsync(async (req, res) => {
  const userId = req.user;
  const user = await getDeliveryPartner(userId);
  if (!user) {
    return messages.notFound("User not found", res);
  }
  return messages.successResponse(
    user,
    res,
    "Profile data fetched successfully"
  );
});

const updateDeliveryPartnerController = catchAsync(async (req, res) => {
  const userId = req.user;
  return await updateDeliveryPartner(userId, req.body, req.files, res);
});

module.exports = {
  registerDeliveryPartnerController,
  getDeliveryPartnerController,
  updateDeliveryPartnerController,
};
