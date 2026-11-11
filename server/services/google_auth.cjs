const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * Returns an authenticated Google client (either OAuth2 or Service Account)
 */
function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  // 1. Try OAuth2 (Recommended by user for getfamiliaradmin@gmail.com with zero cost)
  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/oauth/callback'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  // 2. Try Service Account key path
  if (serviceAccountPath) {
    const resolvedPath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.join(__dirname, '..', '..', serviceAccountPath);

    if (fs.existsSync(resolvedPath)) {
      return new google.auth.GoogleAuth({
        keyFile: resolvedPath,
        scopes: SCOPES
      });
    }
  }

  // 3. Fallback: Check if credentials.json exists in server/credentials/
  const defaultKeyPath = path.join(__dirname, '..', 'credentials', 'google_service_account.json');
  if (fs.existsSync(defaultKeyPath)) {
    return new google.auth.GoogleAuth({
      keyFile: defaultKeyPath,
      scopes: SCOPES
    });
  }

  return null;
}

/**
 * Generates an OAuth2 URL for initial authorization by getfamiliaradmin@gmail.com
 */
function getOAuthConsentUrl() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/oauth/callback';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET harus disetel di file .env terlebih dahulu.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
}

/**
 * Exchanges auth code for refresh token
 */
async function exchangeCodeForTokens(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/oauth/callback';

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

module.exports = {
  getGoogleAuth,
  getOAuthConsentUrl,
  exchangeCodeForTokens,
  SCOPES
};
