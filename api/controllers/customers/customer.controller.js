const messages = require("../../helpers/utils/messages");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const { formatDate } = require("../../helpers/utils/date");
const {
  createCustomer,
  getCustomer,
  updateCustomer,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} = require("../../services/auth");
const { verifyOTPAndLogin } = require("../../services/otp.service");

// Register customer
const registerCustomer = catchAsync(async (req, res) => {
  const result = await createCustomer(req.body, req.headers);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Customer registered successfully"
    );
  } else {
    return messages.failureResponse(result.error || "Registration failed", res);
  }
});

// Login customer
const loginCustomer = catchAsync(async (req, res) => {
  return await verifyOTPAndLogin(req, res);
});

// Get profile
const getCustomerProfile = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await getCustomer(userId);

  if (result?.notFound) {
    return messages.recordNotFound(res, "Customer not found");
  }

  const customer = result.data;
  return messages.successResponse(
    {
      customer: {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        fullName: `${customer.firstName} ${customer.lastName}`.trim(),
        mobNo: customer.mobNo,
        email: customer.email,
        dob: customer.dob ? formatDate(customer.dob) : null,
        gender: customer.gender,
        roles: customer.roles,
        profileCompleted: customer.profileCompleted,
        customerAddress: customer.customerAddress || [],
        profilePicture: customer.profilePicture,
        lastLogin: customer.lastLogin ? formatDate(customer.lastLogin) : null,
      },
    },
    res,
    "Customer profile retrieved successfully"
  );
});

// Update profile
const updateCustomerProfile = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await updateCustomer(userId, req.body, req.files);

  if (result?.success) {
    return messages.successResponse(
      result.data,
      res,
      "Profile updated successfully"
    );
  } else if (result?.notFound) {
    return messages.recordNotFound(res, "Customer not found");
  } else {
    return messages.failureResponse(result.error || "Update failed", res);
  }
});

// Add address
const addAddressController = catchAsync(async (req, res) => {
  const userId = req.user;
  const result = await addCustomerAddress(userId, req.body);

  if (result?.success) {
    return messages.successResponse(
      { address: result.data },
      res,
      "Address added successfully"
    );
  } else if (result?.notFound) {
    return messages.recordNotFound(res, "Customer not found");
  } else {
    return messages.failureResponse(result.error || "Address add failed", res);
  }
});

// Update address
const updateAddressController = catchAsync(async (req, res) => {
  const userId = req.user;
  const { addressId } = req.params;
  const result = await updateCustomerAddress(userId, addressId, req.body);

  if (result?.success) {
    return messages.successResponse(
      { address: result.data },
      res,
      "Address updated successfully"
    );
  } else if (result?.notFound) {
    return messages.recordNotFound(res, "Customer not found");
  } else {
    return messages.failureResponse(
      result.error || "Address update failed",
      res
    );
  }
});

// Delete address
const deleteAddressController = catchAsync(async (req, res) => {
  const userId = req.user;
  const { addressId } = req.params;
  const result = await deleteCustomerAddress(userId, addressId);

  if (result?.success) {
    return messages.successResponse({}, res, "Address deleted successfully");
  } else if (result?.notFound) {
    return messages.recordNotFound(res, "Customer not found");
  } else {
    return messages.failureResponse(
      result.error || "Address delete failed",
      res
    );
  }
});

module.exports = {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  addAddressController,
  updateAddressController,
  deleteAddressController,
};
