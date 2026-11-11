require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { getOAuthConsentUrl, exchangeCodeForTokens } = require('../services/google_auth.cjs');

async function main() {
  console.log('\n======================================================');
  console.log('🔑 GOOGLE OAUTH2 SETUP HELPER (Zero Cost)');
  console.log('Account target: getfamiliaradmin@gmail.com');
  console.log('======================================================\n');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Harap tambahkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET ke file .env terlebih dahulu.');
    console.log('\nPanduan:');
    console.log('1. Buka https://console.cloud.google.com/apis/credentials');
    console.log('2. Buat OAuth 2.0 Client ID (Application Type: Web Application / Desktop App).');
    console.log('3. Masukkan Redirect URI: http://localhost:5000/api/google/oauth/callback atau urn:ietf:wg:oauth:2.0:oob');
    console.log('4. Copy Client ID dan Client Secret ke file .env Anda.\n');
    process.exit(1);
  }

  const authUrl = getOAuthConsentUrl();
  console.log('👉 1. Buka URL ini di browser Anda:');
  console.log('------------------------------------------------------');
  console.log(authUrl);
  console.log('------------------------------------------------------\n');
  console.log('👉 2. Login dengan akun: getfamiliaradmin@gmail.com');
  console.log('👉 3. Berikan izin akses Google Sheets & Google Drive.');
  console.log('👉 4. Setelah selesai, salin Kode Otorisasi (code) yang muncul.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Masukkan Kode Otorisasi (code) dari Google: ', async (code) => {
    rl.close();
    try {
      const tokens = await exchangeCodeForTokens(code.trim());
      console.log('\n✅ Berhasil mendapatkan Token!');
      console.log('Refresh Token:', tokens.refresh_token);

      // Append or update in .env
      const envPath = path.join(__dirname, '..', '..', '.env');
      if (fs.existsSync(envPath) && tokens.refresh_token) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('💾 GOOGLE_REFRESH_TOKEN telah otomatis disimpan ke file .env!\n');
      }
    } catch (err) {
      console.error('❌ Gagal menukar kode:', err.message);
    }
  });
}

main();
