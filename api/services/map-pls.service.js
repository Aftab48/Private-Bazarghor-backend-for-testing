const axios = require("axios");
const mapPlsConfig = require("../../config/map-pls");
const logger = require("../helpers/utils/logger");

let cachedToken = null;
let tokenExpiresAt = 0;

const hasCredentials = () =>
  Boolean(mapPlsConfig.clientId && mapPlsConfig.clientSecret);

const getAccessToken = async (forceRefresh = false) => {
  if (!hasCredentials()) {
    throw new Error(
      "Mappls credentials are missing. Please configure MAPPLS_CLIENT_ID and MAPPLS_CLIENT_SECRET."
    );
  }

  const now = Date.now();
  if (!forceRefresh && cachedToken && tokenExpiresAt > now) {
    return cachedToken;
  }

  const payload = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: mapPlsConfig.clientId,
    client_secret: mapPlsConfig.clientSecret,
  }).toString();

  try {
    const { data } = await axios.post(mapPlsConfig.oauthUrl, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: mapPlsConfig.timeout,
    });

    if (!data?.access_token) {
      throw new Error("Mappls token response is missing access_token");
    }

    cachedToken = data.access_token;
    const expiresInMs = Math.max((data.expires_in || 3600) - 60, 60) * 1000;
    tokenExpiresAt = now + expiresInMs;

    return cachedToken;
  } catch (error) {
    logger.error("Mappls: Failed to fetch OAuth token", {
      message: error.message,
      response: error.response?.data,
    });
    throw new Error("Failed to authenticate with Mappls");
  }
};

const buildUrl = (path, query = {}) => {
  const base = mapPlsConfig.baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  Object.entries(query).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && entry !== "") {
          url.searchParams.append(key, entry);
        }
      });
      return;
    }
    url.searchParams.append(key, value);
  });

  return url.toString();
};

const mapplsGet = async (path, query) => {
  const token = await getAccessToken();

  try {
    const { data } = await axios.get(buildUrl(path, query), {
      headers: { Authorization: `Bearer ${token}` },
      timeout: mapPlsConfig.timeout,
    });
    return data;
  } catch (error) {
    const status = error.response?.status;
    const description =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    logger.error("Mappls: Request failed", {
      path,
      status,
      query,
      description,
    });

    throw new Error(
      `Mappls request failed${status ? ` with status ${status}` : ""}: ${
        description || "Unknown error"
      }`
    );
  }
};

const autosuggest = (query) => mapplsGet("/places/autosuggest", query);
const geocode = (query) => mapplsGet("/places/geocode", query);
const reverseGeocode = (query) => mapplsGet("/places/georeverse", query);

const pickCoordinates = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const directLat = payload.lat ?? payload.latitude;
  const directLng = payload.lng ?? payload.longitude;

  const geometryLat = payload.geometry?.location?.lat;
  const geometryLng = payload.geometry?.location?.lng;

  const lat = Number.parseFloat(
    directLat ?? geometryLat ?? payload?.placeLatitude ?? payload?.Latitude
  );
  const lng = Number.parseFloat(
    directLng ?? geometryLng ?? payload?.placeLongitude ?? payload?.Longitude
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    raw: payload,
  };
};

const resolveCoordinatesFromAddress = async ({
  address,
  city,
  state,
  pincode,
  country = mapPlsConfig.defaultCountry,
}) => {
  if (!address) return null;

  const formattedAddress = [address, city, state, pincode, country]
    .filter(Boolean)
    .join(", ");

  const response = await geocode({ address: formattedAddress });
  const candidate =
    response?.copResults?.[0] ||
    response?.results?.[0] ||
    response?.suggestedLocations?.[0] ||
    response?.data?.[0];

  const coordinates = pickCoordinates(candidate);
  if (!coordinates) return null;

  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
    meta: {
      formattedAddress:
        candidate?.formattedAddress ||
        candidate?.address ||
        candidate?.placeAddress ||
        formattedAddress,
      eLoc: candidate?.eLoc || candidate?.placeId,
    },
  };
};

module.exports = {
  getAccessToken,
  autosuggest,
  geocode,
  reverseGeocode,
  resolveCoordinatesFromAddress,
};
