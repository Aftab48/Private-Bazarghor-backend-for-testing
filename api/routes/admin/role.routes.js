const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  permissionMiddleware,
} = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const { PERMISSIONS } = require("../../../config/constants/permissionConstant");
const { upload } = require("../../middlewares/upload.middleware");
const roleCtrl = require("../../controllers/admin/role.controller");

router.get(
  "/roles",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware(
    [PERMISSIONS.VIEW_ADMINS, PERMISSIONS.MANAGE_ROLE_PERMISSIONS],
    { any: true }
  ),
  roleCtrl.getRolesController
);

router.put(
  "/roles/:code/permissions",
  upload.none(),
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  permissionMiddleware([PERMISSIONS.MANAGE_ROLE_PERMISSIONS]),
  roleCtrl.updateRolePermissionsController
);

router.put(
  "/roles/bulk/permissions",
  upload.none(),
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]), // allow ADMIN too
  permissionMiddleware([PERMISSIONS.MANAGE_ROLE_PERMISSIONS]),
  roleCtrl.bulkUpdateRolePermissionsController
);

module.exports = router;
