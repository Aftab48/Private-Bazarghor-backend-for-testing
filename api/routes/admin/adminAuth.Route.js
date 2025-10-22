const express = require("express");
const router = express.Router();
const { adminLogin } = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
logoutUser
const validate = require("../../middlewares/validate");
const {
  loginAdmin,
} = require("../../helpers/utils/validations/auth/index");

router.use(express.json());

router.post("/login", validate(loginAdmin), adminLogin);
router.post("/logout", authMiddleware([]), logoutUser);

module.exports = router;
