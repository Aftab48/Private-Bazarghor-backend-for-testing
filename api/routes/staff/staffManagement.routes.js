const express = require("express");
const router = express.Router();
const {
  createAdminController,
  deleteAdminController,
  getAllAdminsController,
  getAdminByIdController,
} = require("../../controllers/staff/staffManagement.controller");
const {
  updateAdminController,
  forgotPasswordController,
  resetPasswordController,
  changeAdminPassword,
} = require("../../controllers/admin/admin.controller");
const {
  adminLogin,
  getAdminsController,
} = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth");
const {
  changePasswords,
} = require("../../helpers/utils/validations/auth/changePassword");
const validate = require("../../middlewares/validate");
const {
  createAdminsValidation,
  updateAdminsValidation,
  loginAdmin,
  resetPasswordCode,
} = require("../../helpers/utils/validations/auth/index");
const {
  checkSuperAdmin,
  authMiddleware,
} = require("../../middlewares/auth.middleware");
const {
  uploadAdminProfile,
  upload,
} = require("../../middlewares/upload.middleware");
const { ROLE } = require("../../../config/constants/authConstant");

router.post(
  "/add-admin",
  authMiddleware([]),
  checkSuperAdmin,
  validate(createAdminsValidation),
  uploadAdminProfile,
  createAdminController
);

router.put(
  "/update-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  checkSuperAdmin,
  validate(updateAdminsValidation),
  uploadAdminProfile,
  updateAdminController
);

router.get(
  "/get-all-admin",
  authMiddleware([]),
  checkSuperAdmin,
  getAllAdminsController
);

router.get(
  "/get-adminById/:id",
  authMiddleware([]),
  checkSuperAdmin,
  getAdminByIdController
);

router.delete(
  "/delete-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  checkSuperAdmin,
  deleteAdminController
);

//this endpoint of admin and sub admin when he is logged in
router.post("/login", upload.none(), validate(loginAdmin), adminLogin);
router.post("/logout", authMiddleware([]), logoutUser);

router.get(
  "/get-admin-profile",
  authMiddleware([ROLE.ADMIN]),
  getAdminsController
);

router.get(
  "/get-sub-admin-profile",
  authMiddleware([ROLE.SUB_ADMIN]),
  getAdminsController
);

router.put(
  "/update-admin",
  authMiddleware([ROLE.ADMIN]),
  validate(updateAdminsValidation),
  uploadAdminProfile,
  updateAdminController
);

router.put(
  "/update-sub-admin",
  authMiddleware([ROLE.SUB_ADMIN]),
  validate(updateAdminsValidation),
  uploadAdminProfile,
  updateAdminController
);

router.post("/forget-password", upload.none(), forgotPasswordController);
router.post(
  "/reset-password",
  validate(resetPasswordCode),
  upload.none(),
  resetPasswordController
);

router.post(
  "/admin-change-password/:id",
  authMiddleware([ROLE.ADMIN]),
  validate(changePasswords),
  upload.none(),
  changeAdminPassword
);

router.post(
  "/sub-admin-change-password/:id",
  authMiddleware([ROLE.SUB_ADMIN]),
  validate(changePasswords),
  upload.none(),
  changeAdminPassword
);

module.exports = router;
