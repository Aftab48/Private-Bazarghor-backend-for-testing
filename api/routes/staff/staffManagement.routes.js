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
} = require("../../controllers/admin/admin.controller");
const {
  adminLogin,
  getAdminsController,
} = require("../../controllers/admin/admin.controller");
const { logoutUser } = require("../../services/auth");
const validate = require("../../middlewares/validate");
const {
  createAdminsValidation,
  updateAdminsValidation,
  loginAdmin,
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

router.post("/login", upload.none(), validate(loginAdmin), adminLogin);
router.post("/logout", authMiddleware([]), logoutUser);

router.put(
  "/update-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  checkSuperAdmin,
  validate(updateAdminsValidation),
  uploadAdminProfile,
  updateAdminController
);

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

router.delete(
  "/delete-admin/:id",
  authMiddleware([ROLE.SUPER_ADMIN]),
  checkSuperAdmin,
  deleteAdminController
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

module.exports = router;
