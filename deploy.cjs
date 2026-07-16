// deploy.cjs - Deploy dist folder to VPS via SSH/SFTP
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '76.13.196.51',
  username: 'root',
  password: ";Z'8.anj(ttkX.+59'hO",
  readyTimeout: 30000,
};

const localDistDir = path.join(__dirname, 'dist');
const remoteBase = '/var/www/alpsystem';

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`Uploading: ${path.basename(remotePath)}`);
    sftp.fastPut(localPath, remotePath, {}, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✓ ${path.basename(remotePath)}`);
        resolve();
      }
    });
  });
}

function mkdirRemote(sftp, remotePath) {
  return new Promise((resolve) => {
    sftp.mkdir(remotePath, (err) => {
      resolve(); // ignore error if already exists
    });
  });
}

async function uploadDir(sftp, localDir, remoteDir) {
  await mkdirRemote(sftp, remoteDir);
  const items = fs.readdirSync(localDir);
  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = remoteDir + '/' + item;
    const stat = fs.statSync(localPath);
    if (stat.isDirectory()) {
      await uploadDir(sftp, localPath, remotePath);
    } else {
      await uploadFile(sftp, localPath, remotePath);
    }
  }
}

function getSFTP(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) reject(err);
      else resolve(sftp);
    });
  });
}

async function main() {
  const conn = new Client();
  
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect(config);
  });
  
  console.log('✅ SSH Connected to VPS');
  
  try {
    const sftp = await getSFTP(conn);
    console.log('📁 Starting upload...');
    
    // 1. Upload frontend dist
    await uploadDir(sftp, localDistDir, remoteBase + '/dist');
    
    // 2. Upload backend server file
    console.log('Uploading backend server file...');
    await uploadFile(sftp, path.join(__dirname, 'server', 'index.cjs'), remoteBase + '/server/index.cjs');

    console.log('\n🎉 Upload complete! Restarting PM2 process...');
    
    // 3. Restart backend server process
    await new Promise((resolve, reject) => {
      conn.exec('pm2 restart ALPSystem', (err, stream) => {
        if (err) return reject(err);
        stream.on('close', resolve).stderr.on('data', data => console.error(data.toString()));
      });
    });
    
    console.log('✅ PM2 process "ALPSystem" restarted successfully!');
    console.log('🌐 Live at: http://76.13.196.51');
  } finally {
    conn.end();
  }
}

main().catch(err => {
  console.error('❌ Deploy failed:', err.message);
  process.exit(1);
});
