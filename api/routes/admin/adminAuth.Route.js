const express = require("express");
const router = express.Router();
const adminControllers = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const validate = require("../../middlewares/validate");
const adminValidate = require("../../helpers/utils/validations/auth/index");
const addStaff = require("../../controllers/staff/staffManagement.controller");
const {
  changePasswords,
} = require("../../helpers/utils/validations/auth/changePassword");
const {
  uploadAdminProfile,
  upload,
} = require("../../middlewares/upload.middleware");

router.use(express.json());

router.post(
  "/login",
  upload.none(),
  validate(adminValidate.loginAdmin),
  adminControllers.adminLogin
);

router.post(
  "/change-password/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  validate(changePasswords),
  upload.none(),
  adminControllers.changeAdminPassword
);

router.get(
  "/profile",
  authMiddleware([ROLE.SUPER_ADMIN]),
  adminControllers.getAdminsController
);

router.put(
  "/update",
  authMiddleware([ROLE.SUPER_ADMIN]),
  validate(adminValidate.adminUpdate),
  uploadAdminProfile,
  addStaff.updateSelfAdminController
);

router.post(
  "/reset-password",
  validate(adminValidate.resetPasswordCode),
  adminControllers.resetPasswordController
);

router.post("/forget-password", adminControllers.forgotPasswordController);
router.post("/logout", authMiddleware([]), logoutUser);

module.exports = router;
