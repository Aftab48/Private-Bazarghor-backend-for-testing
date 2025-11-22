const router = require("express").Router();
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { ROLE } = require("../../../config/constants/authConstant");
const deliveryPartnerController = require("../../controllers/deliveryPartner/delivery.controller");

router.post(
  "/respond-order/:orderId",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  deliveryPartnerController.respondToOrder
);

router.put(
  "/pickup-order/:orderId",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  deliveryPartnerController.pickupOrder
);

router.put(
  "/deliver-order/:orderId",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  deliveryPartnerController.deliverOrder
);

router.get(
  "/my-stats",
  authMiddleware([ROLE.DELIVERY_PARTNER]),
  deliveryPartnerController.getMyDeliveryStats
);

module.exports = router;
