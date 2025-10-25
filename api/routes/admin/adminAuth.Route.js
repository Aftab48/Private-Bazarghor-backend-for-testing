const express = require("express");
const router = express.Router();
const { adminLogin, changeAdminPassword, forgotPasswordController, resetPasswordController } = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth");
const { changePasswords, } = require("../../helpers/utils/validations/auth/changePassword")
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
logoutUser
const validate = require("../../middlewares/validate");
const {
  loginAdmin,
  resetPasswordCode
} = require("../../helpers/utils/validations/auth/index");

router.use(express.json());

router.post("/login", validate(loginAdmin), adminLogin);
router.post("/logout", authMiddleware([]), logoutUser);
router.post("/change-password/:id", authMiddleware([ROLE.SUPER_ADMIN]), validate(changePasswords), changeAdminPassword);
router.post("/forget-password", forgotPasswordController);
router.post("/reset-password", validate(resetPasswordCode), resetPasswordController);


module.exports = router;
