const DEFAULT_OAUTH_URL =
  "https://outpost.mappls.com/api/security/oauth/token";
const DEFAULT_BASE_URL = "https://atlas.mappls.com/api";

module.exports = {
  oauthUrl: process.env.MAPPLS_OAUTH_URL || DEFAULT_OAUTH_URL,
  baseUrl: process.env.MAPPLS_BASE_URL || DEFAULT_BASE_URL,
  clientId: process.env.MAPPLS_CLIENT_ID || "",
  clientSecret: process.env.MAPPLS_CLIENT_SECRET || "",
  defaultCountry: process.env.MAPPLS_DEFAULT_COUNTRY || "India",
  timeout: parseInt(process.env.MAPPLS_TIMEOUT || "10000", 10),
};

