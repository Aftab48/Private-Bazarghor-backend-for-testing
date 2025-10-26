const {
  createAdminService,
  deleteAdminService,
  getAdminsService,
  getAdminByIdService,
} = require("../../services/staff");
const { catchAsync } = require("../../helpers/utils/catchAsync");
const messages = require("../../helpers/utils/messages");

const createAdminController = catchAsync(async (req, res) => {
  const result = await createAdminService(req.body, req.files);

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
  const { id } = req.params;
  const result = await deleteAdminService(id);

  if (result.success)
    return messages.successResponse(
      result.data,
      res,
      "Admin deleted successfully"
    );
  if (result.notFound) return messages.recordNotFound(res, result.error);

  return messages.failureResponse(result.error, res);
});

// GET ALL
const getAllAdminsController = catchAsync(async (req, res) => {
  const result = await getAdminsService();

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
  const { id } = req.params;
  const result = await getAdminByIdService(id);

  if (result.success)
    return messages.successResponse(
      result.data,
      res,
      "Admin fetched successfully"
    );
  if (result.notFound) return messages.recordNotFound(res, result.error);

  return messages.failureResponse(result.error, res);
});

module.exports = {
  createAdminController,
  deleteAdminController,
  getAllAdminsController,
  getAdminByIdController,
};
