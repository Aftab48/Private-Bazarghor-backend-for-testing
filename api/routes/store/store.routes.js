const storeControllers = require("../../controllers/store/store.controller");
const express = require("express");
const router = express.Router();
const { ROLE } = require("../../../config/constants/authConstant");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const storeValidations = require("../../helpers/utils/validations/stores/index");
const { upload } = require("../../middlewares/upload.middleware");

router.put(
  "/:id/open-close",
  authMiddleware([ROLE.VENDOR, ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  storeControllers.toggleStoreStatusController
);

router.get(
  "/admin/get-store",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  storeControllers.getAllStoresListByAdminController
);

router.get(
  "/admin/get-store-by-id/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  storeControllers.getStoreByIdAdminControllers
);

router.put(
  "/admin/update-store-by-id/:id",
  authMiddleware([ROLE.SUPER_ADMIN, ROLE.ADMIN]),
  upload.none(),
  validate(storeValidations.updateStoreByAdmin),
  storeControllers.updateStoreByAdminController
);

module.exports = router;
