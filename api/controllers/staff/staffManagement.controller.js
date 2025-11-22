const adminServices = require("../../services/staff.service");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const createAdminController = catchAsync(async (req, res) => {
  const result = await adminServices.createAdminService(
    req.body,
    req.files,
    req.user
  );

  if (result.success)
    return messages.successResponse(
      result.data,
      res,
      "Admin created successfully"
    );
  if (result?.data) return messages.insufficientParameters(res, result.error);
  if (result?.notFound) return messages.recordNotFound(res, result.error);

  return messages.failureResponse(result.error, res);
});

const deleteAdminController = catchAsync(async (req, res) => {
  const result = await adminServices.deleteAdminService(
    req.params.id,
    req.user
  );
  if (result.success)
    return messages.successResponse(
      result.data,
      res,
      "Admin deleted successfully"
    );
  if (result?.notFound) return messages.recordNotFound(res, result.error);
  return messages.failureResponse(result.error, res);
});

const getAllAdminsController = catchAsync(async (req, res) => {
  const result = await adminServices.getAdminsService(req.user);
  if (result.success)
    return messages.successResponse(
      result.data,
      res,
      "Admins fetched successfully"
    );
  return messages.failureResponse(result.error, res);
});

// GET BY ID
const getAdminByIdController = catchAsync(async (req, res) => {
  const result = await adminServices.getAdminByIdService(
    req.params.id,
    req.user
  );
  if (result.success)
    return messages.successResponse(
      result.data,
      res,
      "Admin details fetched successfully"
    );
  if (result?.notFound) return messages.recordNotFound(res, result.error);
  return messages.failureResponse(result.error, res);
});

const updateSelfAdminController = catchAsync(async (req, res) => {
  const result = await adminServices.updateSelfAdminService(
    req.user,
    req.body,
    req.files
  );

  if (result?.success) {
    return messages.successResponse(
      result?.data,
      res,
      "Profile updated successfully"
    );
  } else if (result?.notFound) {
    return messages.recordNotFound(res, result.error);
  } else {
    return messages.failureResponse(result.error || "Update failed", res);
  }
});

module.exports = {
  createAdminController,
  deleteAdminController,
  getAllAdminsController,
  getAdminByIdController,
  updateSelfAdminController,
};
