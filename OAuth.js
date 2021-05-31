/**
 * Generates a JSON Web Token (JWT) for Salesforce server-to-server integration.
 *
 * @return {string} the JWT
 */
const createJwt_ = () => {
  // Your super secret private key
  const privateKey = DriveApp.getFileById(PRIVATE_KEY_FILE_ID)
    .getBlob()
    .getDataAsString();
  const accessToken = JWT.createJwt({
    privateKey,
    expiresInMinutes: 2, // expires in 2 minutes, must be within 3 minutes
    // iss = issuer's client_id, aud = audience identifies the authroization server
    data: {
      iss: CONSUMER_KEY,
      aud: "https://login.salesforce.com",
      sub: USERNAME,
    },
  });
  return accessToken;
};

/**
 * Requests an access token from Salesforce using a JWT for authentication.
 *
 * @return {object} the response object which includes the access_token and instance_url
 */
const requestAccessToken_ = () => {
  const jwt = createJwt_();
  const endpoint =
    TOKEN_URL +
    "?grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" +
    "&assertion=" +
    jwt;
  const resp = UrlFetchApp.fetch(endpoint, {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
  });

  return JSON.parse(resp.getContentText());
};
