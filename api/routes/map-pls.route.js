const express = require("express");
const mapPlsController = require("../controllers/map-pls.controller");

const router = express.Router();

router.get("/places/autosuggest", mapPlsController.autosuggest);
router.get("/places/geocode", mapPlsController.geocode);
router.get("/places/reverse-geocode", mapPlsController.reverseGeocode);

module.exports = router;
