const userStaff = require("../../services/userManagement.service");
const messages = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");

//Vendors Controllers
const createVendorByAdminController = catchAsync(async (req, res) => {
  const createdBy = req?.user;
  const result = await userStaff?.createVendorByAdmin(req, createdBy);
  if (result?.success) {
    return messages.successResponse(
      result?.data,
      res,
      "Vendor created successfully"
    );
  } else {
    return messages.failureResponse(
      result?.error || "Vendor creation failed",
      res
    );
  }
});

const getAllVendorsController = catchAsync(async (req, res) => {
  const result = await userStaff.getAllVendors(req.query);
  if (!result?.success)
    return messages.failureResponse(
      result?.error || "Vendor fetching failed",
      res
    );
  return messages.successResponse(
    result?.data,
    res,
    "Vendor Fetched successfully"
  );
});

const getVendorByIdController = catchAsync(async (req, res) => {
  const result = await userStaff.getVendorById(req.params.id);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Vendor fetching failed",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Vendor Fetched successfully"
  );
});

const updateVendorByAdminController = catchAsync(async (req, res) => {
  const result = await userStaff.updateVendorByAdmin(
    req.params.id,
    req.body,
    req.files
  );
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Vendor update failed",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Vendor updated successfully"
  );
});

const deleteVendorByAdminController = catchAsync(async (req, res) => {
  const result = await userStaff.deleteVendorByAdmin(req.params.id);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Vendor Delete failed",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Vendor deleted successfully"
  );
});

//Delivery Partner Controllers
const createDeliveryPartnerByAdminController = catchAsync(async (req, res) => {
  const createdBy = req?.user;
  const result = await userStaff?.createDeliveryPartnerByAdmin(req, createdBy);

  if (result?.success)
    return messages.successResponse(
      result?.data,
      res,
      "Delivery Partner created successfully"
    );
  else
    return messages.failureResponse(
      result?.error || "Failed to create Delivery Partner",
      res
    );
});

const getAllDeliveryPartnersController = catchAsync(async (req, res) => {
  const result = await userStaff.getAllDeliveryPartners(req.query);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to fetch Delivery Partner",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Delivery Partner Fetched successfully"
  );
});

const getDeliveryPartnerByIdController = catchAsync(async (req, res) => {
  const result = await userStaff.getDeliveryPartnerById(req.params.id);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to fetch Delivery Partner",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Delivery Partner Fetched successfully"
  );
});

const updateDeliveryPartnerByAdminController = catchAsync(async (req, res) => {
  const result = await userStaff.updateDeliveryPartnerByAdmin(
    req.params.id,
    req.body,
    req.files
  );
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to Update Delivery Partner",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Delivery Partner updated successfully"
  );
});

const deleteDeliveryPartnerByAdminController = catchAsync(async (req, res) => {
  const result = await userStaff.deleteDeliveryPartnerByAdmin(req.params.id);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to Delete Delivery Partner",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Delivery Partner deleted successfully"
  );
});

//customers controllers
const createCustomerByAdminController = catchAsync(async (req, res) => {
  const createdBy = req?.user;
  const result = await userStaff?.createCustomerByAdmin(req, createdBy);

  if (result?.success)
    return messages.successResponse(
      result?.data,
      res,
      "Customer created successfully"
    );
  else
    return messages.failureResponse(
      result?.error || "Failed to create Customer",
      res
    );
});

const getAllCustomersController = catchAsync(async (req, res) => {
  const result = await userStaff.getAllCustomers(req.query);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to Fetch Customer",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Customers Fetched successfully"
  );
});

const getCustomerByIdController = catchAsync(async (req, res) => {
  const result = await userStaff.getCustomerById(req.params.id);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to Fetch Customer",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Customer Fetched successfully"
  );
});

const updateCustomerByAdminController = catchAsync(async (req, res) => {
  const result = await userStaff.updateCustomerByAdmin(
    req.params.id,
    req.body,
    req.files
  );
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to update Customer",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Customer updated successfully"
  );
});

const deleteCustomerByAdminController = catchAsync(async (req, res) => {
  const result = await userStaff.deleteCustomerByAdmin(req.params.id);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to Delete Customer",
      res
    );
  return messages.successResponse(
    result.data,
    res,
    "Customer deleted successfully"
  );
});

const verifyPendingStatus = catchAsync(async (req, res) => {
  const adminId = req.user;
  const { userId } = req.params;
  const { roleType } = req.body;
  const result = await userStaff.verifyPendingStatus(adminId, userId, roleType);
  if (!result.success)
    return messages.failureResponse(
      result?.error || "Failed to Update Status",
      res
    );
  return messages.successResponse(
    result?.data,
    res,
    `${roleType} account approved successfully`
  );
});

module.exports = {
  createVendorByAdminController,
  getAllVendorsController,
  getVendorByIdController,
  updateVendorByAdminController,
  deleteVendorByAdminController,
  createDeliveryPartnerByAdminController,
  getAllDeliveryPartnersController,
  getDeliveryPartnerByIdController,
  updateDeliveryPartnerByAdminController,
  deleteDeliveryPartnerByAdminController,
  createCustomerByAdminController,
  getAllCustomersController,
  getCustomerByIdController,
  updateCustomerByAdminController,
  deleteCustomerByAdminController,
  verifyPendingStatus,
};
