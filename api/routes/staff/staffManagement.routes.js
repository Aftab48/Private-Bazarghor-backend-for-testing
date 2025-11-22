const express = require("express");
const router = express.Router();
const addStaff = require("../../controllers/staff/staffManagement.controller");
const adminControllers = require("../../controllers/admin/admin.controller");
const validate = require("../../middlewares/validate");
const adminValidate = require("../../helpers/utils/validations/auth/index");
const { ROLE } = require("../../../config/constants/authConstant");
const {
  adminLogin,
  getAdminsController,
} = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth.service");
const {
  changePasswords,
} = require("../../helpers/utils/validations/auth/changePassword");
const {
  checkSuperAdmin,
  authMiddleware,
  permissionMiddleware,
} = require("../../middlewares/auth.middleware");
const { PERMISSIONS } = require("../../../config/constants/permissionConstant");
const {
  uploadAdminProfile,
  upload,
} = require("../../middlewares/upload.middleware");

router.post(
  "/add-admin",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  permissionMiddleware(
    [PERMISSIONS.CREATE_ADMIN, PERMISSIONS.CREATE_SUB_ADMIN],
    { any: true }
  ),
  validate(adminValidate.createAdminsValidation),
  uploadAdminProfile,
  addStaff.createAdminController
);

router.put(
  "/update-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  permissionMiddleware(
    [PERMISSIONS.UPDATE_ADMIN, PERMISSIONS.UPDATE_SUB_ADMIN],
    { any: true }
  ),
  validate(adminValidate.updateAdminsValidation),
  uploadAdminProfile,
  adminControllers.updateAdminController
);

router.get(
  "/get-all-admin",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  permissionMiddleware([PERMISSIONS.VIEW_ADMINS]),
  addStaff.getAllAdminsController
);

router.get(
  "/get-adminById/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  permissionMiddleware([PERMISSIONS.VIEW_ADMINS]),
  addStaff.getAdminByIdController
);

router.delete(
  "/delete-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  permissionMiddleware(
    [PERMISSIONS.DELETE_ADMIN, PERMISSIONS.DELETE_SUB_ADMIN],
    { any: true }
  ),
  addStaff.deleteAdminController
);

//this endpoint of admin and sub admin when he is logged in
router.post(
  "/login",
  upload.none(),
  validate(adminValidate.loginAdmin),
  adminLogin
);
router.post("/logout", authMiddleware([]), logoutUser);

router.get(
  "/get-admin-profile",
  authMiddleware([ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_ADMINS]),
  getAdminsController
);

router.get(
  "/get-sub-admin-profile",
  authMiddleware([ROLE.SUB_ADMIN]),
  permissionMiddleware([PERMISSIONS.VIEW_ADMINS]),
  adminControllers.getAdminsController
);

router.put(
  "/update-admin",
  authMiddleware([ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_ADMIN]),
  validate(adminValidate.updateAdminsValidation),
  uploadAdminProfile,
  addStaff.updateSelfAdminController
);

router.put(
  "/update-sub-admin",
  authMiddleware([ROLE.SUB_ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_SUB_ADMIN]),
  validate(adminValidate.updateAdminsValidation),
  uploadAdminProfile,
  addStaff.updateSelfAdminController
);

router.post(
  "/admin-change-password/:id",
  authMiddleware([ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_ADMIN]),
  validate(changePasswords),
  upload.none(),
  adminControllers.changeAdminPassword
);

router.post(
  "/sub-admin-change-password/:id",
  authMiddleware([ROLE.SUB_ADMIN]),
  permissionMiddleware([PERMISSIONS.UPDATE_SUB_ADMIN]),
  validate(changePasswords),
  upload.none(),
  adminControllers.changeAdminPassword
);

router.post(
  "/forget-password",
  upload.none(),
  adminControllers.forgotPasswordController
);

router.post(
  "/reset-password",
  validate(adminValidate.resetPasswordCode),
  upload.none(),
  adminControllers.resetPasswordController
);

module.exports = router;
