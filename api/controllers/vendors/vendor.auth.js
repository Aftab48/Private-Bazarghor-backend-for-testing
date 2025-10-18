const { createVendor } = require("../../services/auth");

const createVendorController = async (req, res) => {
  return await createVendor(req, res);
};

module.exports = {
  createVendorController,
};
