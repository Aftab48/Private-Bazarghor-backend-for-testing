const { catchAsync } = require("../helpers/utils/catchAsync");
const messages = require("../helpers/utils/messages");
const mapPlsService = require("../services/map-pls.service");

const normalizeAutosuggestQuery = (query) => {
  if (query.input || query.q) return query;
  if (query.query) {
    return { ...query, input: query.query };
  }
  return query;
};

const autosuggest = catchAsync(async (req, res) => {
  const normalized = normalizeAutosuggestQuery(req.query || {});
  if (!normalized.input && !normalized.q) {
    return messages.badRequest(
      {},
      res,
      "Search text is required via ?input= or ?q="
    );
  }

  const data = await mapPlsService.autosuggest(normalized);
  return messages.successResponse(
    { provider: "Mappls", data },
    res,
    "Places autosuggest fetched successfully"
  );
});

const geocode = catchAsync(async (req, res) => {
  if (!req.query?.address && !req.query?.eloc) {
    return messages.badRequest({}, res, "address or eloc query param required");
  }

  const data = await mapPlsService.geocode(req.query);
  return messages.successResponse(
    { provider: "Mappls", data },
    res,
    "Geocode data fetched successfully"
  );
});

const reverseGeocode = catchAsync(async (req, res) => {
  const { lat, lng } = req.query || {};
  if (lat === undefined || lng === undefined) {
    return messages.badRequest(
      {},
      res,
      "lat and lng query params are required"
    );
  }

  const data = await mapPlsService.reverseGeocode(req.query);
  return messages.successResponse(
    { provider: "Mappls", data },
    res,
    "Reverse geocode data fetched successfully"
  );
});

module.exports = {
  autosuggest,
  geocode,
  reverseGeocode,
};
