const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");
const User = require("../../models/user");
const {
  createCustomer,
  getCustomer,
  updateCustomer,
} = require("../../services/auth");
const { verifyOTPAndLogin } = require("../../services/otp.service");
const { formatDate } = require("../../helpers/utils/date");

const registerCustomer = catchAsync(async (req, res) => {
  return await createCustomer(req, res);
});

const loginCustomer = catchAsync(async (req, res) => {
  return await verifyOTPAndLogin(req, res);
});

const getCustomerProfile = catchAsync(async (req, res) => {
  const userId = req.user;
  console.log("userId: ", userId);

  if (!userId) {
    return messages.unAuthorizedRequest("User not authenticated", res);
  }

  const customer = await getCustomer(userId);
  if (!customer) {
    return messages.recordNotFound(res, "Customer not found");
  }

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

const updateCustomerProfile = catchAsync(async (req, res) => {
  const userId = req.user;

  if (!userId) {
    return messages.unAuthorizedRequest("User not authenticated", res);
  }

  return await updateCustomer(userId, req.body, req.files, res);
});

const addCustomerAddress = catchAsync(async (req, res) => {
  const userId = req.user;
  const {
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    landmark,
    addressType,
    isDefault,
  } = req.body;

  if (!userId) {
    return messages.unAuthorizedRequest("User not authenticated", res);
  }

  if (!addressLine1 || !city || !state || !pincode) {
    return messages.insufficientParameters(
      res,
      "Address line 1, city, state, and pincode are required"
    );
  }

  const customer = await getCustomer(userId);
  if (!customer) {
    return messages.recordNotFound(res, "Customer not found");
  }

  const newAddress = {
    addressLine1,
    addressLine2: addressLine2 || "",
    city,
    state,
    pincode,
    landmark: landmark || "",
    addressType: addressType || "home",
    isDefault: isDefault || false,
  };

  if (isDefault) {
    const updatedAddresses = customer.customerAddress.map((addr) => ({
      ...addr,
      isDefault: false,
    }));
    updatedAddresses.push(newAddress);

    await User.findByIdAndUpdate(userId, {
      customerAddress: updatedAddresses,
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      $push: { customerAddress: newAddress },
    });
  }

  return messages.successResponse(
    { address: newAddress },
    res,
    "Address added successfully"
  );
});


const updateCustomerAddress = catchAsync(async (req, res) => {
  const userId = req.user;
  const { addressId } = req.params;

  const {
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    landmark,
    addressType,
    isDefault,
  } = req.body;

  if (!userId) {
    return messages.unAuthorizedRequest("User not authenticated", res);
  }

  if (!addressId) {
    return messages.insufficientParameters(res, "Address ID is required");
  }

  const customer = await getCustomer(userId);
  if (!customer) {
    return messages.recordNotFound(res, "Customer not found");
  }

  const cleanAddressId = String(addressId).trim();
  const addressIndex = customer.customerAddress.findIndex(
    (addr) => String(addr._id) === cleanAddressId
  );

  if (addressIndex === -1) {
    return messages.recordNotFound(res, "Address not found");
  }

  const currentAddr = customer.customerAddress[addressIndex];
  const updatedAddress = {
    ...currentAddr,
    addressLine1: addressLine1 || currentAddr.addressLine1,
    addressLine2: addressLine2 ?? currentAddr.addressLine2,
    city: city || currentAddr.city,
    state: state || currentAddr.state,
    pincode: pincode || currentAddr.pincode,
    landmark: landmark ?? currentAddr.landmark,
    addressType: addressType || currentAddr.addressType,
    isDefault: isDefault ?? currentAddr.isDefault,
  };

  let updatedAddresses;

  if (isDefault) {
    // Set this one default, others false
    updatedAddresses = customer.customerAddress.map((addr, i) => ({
      ...addr,
      isDefault: i === addressIndex,
    }));
  } else {
    updatedAddresses = [...customer.customerAddress];
    updatedAddresses[addressIndex] = updatedAddress;
  }

  await User.findByIdAndUpdate(userId, { customerAddress: updatedAddresses });

  return messages.successResponse(
    { address: updatedAddress },
    res,
    "Address updated successfully"
  );
});

const deleteCustomerAddress = catchAsync(async (req, res) => {
  const userId = req.user;
  const { addressId } = req.params;

  if (!userId) {
    return messages.unAuthorizedRequest("User not authenticated", res);
  }

  if (!addressId) {
    return messages.insufficientParameters(res, "Address ID is required");
  }

  const customer = await getCustomer(userId);
  if (!customer) {
    return messages.recordNotFound(res, "Customer not found");
  }

  const addressExists = customer.customerAddress.some(
    (addr) => addr._id.toString() === addressId
  );

  if (!addressExists) {
    return messages.recordNotFound(res, "Address not found");
  }

  await User.findByIdAndUpdate(userId, {
    $pull: { customerAddress: { _id: addressId } },
  });

  return messages.successResponse(
    { message: "Address deleted successfully" },
    res,
    "Address deleted successfully"
  );
});

module.exports = {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
};
