require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exchangeCodeForTokens } = require('../services/google_auth.cjs');

const code = process.argv[2];

if (!code) {
  console.error('Usage: node server/scripts/save_code.cjs <AUTHORIZATION_CODE>');
  process.exit(1);
}

(async () => {
  try {
    console.log('Exchanging authorization code for tokens...');
    // Decode URI component in case it's URL-encoded
    const cleanCode = decodeURIComponent(code.trim());
    const tokens = await exchangeCodeForTokens(cleanCode);

    if (!tokens.refresh_token) {
      console.warn('⚠️ Warning: No refresh_token returned. (Google only sends refresh_token on initial consent. If already consented, revoke access at https://myaccount.google.com/permissions and retry).');
      if (tokens.access_token) {
        console.log('Access token received.');
      }
    } else {
      console.log('✅ Refresh token obtained successfully!');
    }

    const envPath = path.join(__dirname, '..', '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (tokens.refresh_token) {
      if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('💾 GOOGLE_REFRESH_TOKEN saved to .env!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to exchange code:', err.message);
    process.exit(1);
  }
})();
