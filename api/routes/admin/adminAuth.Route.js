const express = require("express");
const router = express.Router();
const {
  adminLogin,
  changeAdminPassword,
  forgotPasswordController,
  resetPasswordController,
  getAdminsController,
  updateAdminController,
} = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth");
const {
  changePasswords,
} = require("../../helpers/utils/validations/auth/changePassword");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
logoutUser;
const validate = require("../../middlewares/validate");
const {
  loginAdmin,
  resetPasswordCode,
  adminUpdate,
} = require("../../helpers/utils/validations/auth/index");
const {
  uploadAdminProfile,
  upload,
} = require("../../middlewares/upload.middleware");

router.use(express.json());

router.post("/login", upload.none(), validate(loginAdmin), adminLogin);
router.post("/logout", authMiddleware([]), logoutUser);
router.post(
  "/change-password/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  validate(changePasswords),
  upload.none(),
  changeAdminPassword
);
router.get("/profile", authMiddleware([ROLE.SUPER_ADMIN]), getAdminsController);
router.put(
  "/update",
  authMiddleware([ROLE.SUPER_ADMIN]),
  validate(adminUpdate),
  uploadAdminProfile,
  updateAdminController
);
router.post("/forget-password", forgotPasswordController);
router.post(
  "/reset-password",
  validate(resetPasswordCode),
  resetPasswordController
);

module.exports = router;
