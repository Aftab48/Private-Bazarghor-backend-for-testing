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
const { logoutUser } = require("../../services/auth");
const {
  changePasswords,
} = require("../../helpers/utils/validations/auth/changePassword");
const {
  checkSuperAdmin,
  authMiddleware,
} = require("../../middlewares/auth.middleware");
const {
  uploadAdminProfile,
  upload,
} = require("../../middlewares/upload.middleware");

router.post(
  "/add-admin",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  validate(adminValidate.createAdminsValidation),
  uploadAdminProfile,
  addStaff.createAdminController
);

router.put(
  "/update-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  validate(adminValidate.updateAdminsValidation),
  uploadAdminProfile,
  adminControllers.updateAdminController
);

router.get(
  "/get-all-admin",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  addStaff.getAllAdminsController
);

router.get(
  "/get-adminById/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
  addStaff.getAdminByIdController
);

router.delete(
  "/delete-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  checkSuperAdmin,
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
  getAdminsController
);

router.get(
  "/get-sub-admin-profile",
  authMiddleware([ROLE.SUB_ADMIN]),
  adminControllers.getAdminsController
);

router.put(
  "/update-admin",
  authMiddleware([ROLE.ADMIN]),
  validate(adminValidate.updateAdminsValidation),
  uploadAdminProfile,
  addStaff.updateSelfAdminController
);

router.put(
  "/update-sub-admin",
  authMiddleware([ROLE.SUB_ADMIN]),
  validate(adminValidate.updateAdminsValidation),
  uploadAdminProfile,
  addStaff.updateSelfAdminController
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

router.post(
  "/admin-change-password/:id",
  authMiddleware([ROLE.ADMIN]),
  validate(changePasswords),
  upload.none(),
  adminControllers.changeAdminPassword
);

router.post(
  "/sub-admin-change-password/:id",
  authMiddleware([ROLE.SUB_ADMIN]),
  validate(changePasswords),
  upload.none(),
  adminControllers.changeAdminPassword
);

module.exports = router;
