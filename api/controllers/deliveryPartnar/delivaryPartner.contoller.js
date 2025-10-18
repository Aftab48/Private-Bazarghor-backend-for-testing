const { createDeliveryPartner } = require("../../services/auth");

const registerDeliveryPartnerController = async (req, res) => {
  return await createDeliveryPartner(req, res);
};

module.exports = {
  registerDeliveryPartnerController,
};
