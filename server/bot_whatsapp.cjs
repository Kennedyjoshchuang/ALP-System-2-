const path = require('path');
const pino = require('pino');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const botAgent = require('./bot_agent.cjs');

let sock = null;
let latestQR = null;
let latestQRImage = null;
let connectionStatus = 'disconnected'; // 'disconnected' | 'waiting_qr' | 'connecting' | 'connected'
let botJid = null;
let reconnectAttempts = 0;

function getBotStatus() {
  return {
    status: connectionStatus,
    botJid,
    hasQR: !!latestQR,
    reconnectAttempts
  };
}

async function getLatestQR() {
  return {
    raw: latestQR,
    dataUrl: latestQRImage
  };
}

async function sendWhatsAppMessage(chatId, text) {
  if (!sock || connectionStatus !== 'connected') {
    console.warn('[bot_whatsapp] Cannot send message, socket not connected.');
    return false;
  }
  try {
    await sock.sendMessage(chatId, { text });
    return true;
  } catch (err) {
    console.error('[bot_whatsapp] Failed to send message to', chatId, ':', err.message);
    return false;
  }
}

async function initWhatsAppBot(supabase) {
  if (process.env.WA_BOT_ENABLED === 'false') {
    console.log('[bot_whatsapp] WhatsApp bot is disabled via WA_BOT_ENABLED=false.');
    return null;
  }

  const authDir = path.join(__dirname, 'auth_info_baileys');
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`[bot_whatsapp] Starting Baileys v${version.join('.')}, isLatest: ${isLatest}`);
  connectionStatus = 'connecting';

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }), // Set to 'silent' or 'warn' to avoid terminal spam
    printQRInTerminal: false,
    auth: state,
    browser: ['ALP Freight System', 'Chrome', '1.0.0'],
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR = qr;
      connectionStatus = 'waiting_qr';
      try {
        latestQRImage = await QRCode.toDataURL(qr);
      } catch (e) {
        latestQRImage = null;
      }

      console.log('\n======================================================');
      console.log('📱 WHATSAPP BOT PAIRING QR CODE:');
      console.log('Scan this code with WhatsApp > Linked Devices > Link a Device:');
      console.log('Or view in browser at: http://localhost:5000/api/bot/qr');
      console.log('======================================================\n');
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === 'open') {
      latestQR = null;
      latestQRImage = null;
      connectionStatus = 'connected';
      reconnectAttempts = 0;
      botJid = sock.user ? sock.user.id : null;
      console.log('\n======================================================');
      console.log(`✅ WHATSAPP BOT CONNECTED! Logged in as: ${botJid}`);
      console.log('======================================================\n');
    }

    if (connection === 'close') {
      connectionStatus = 'disconnected';
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.warn(`[bot_whatsapp] Connection closed due to:`, lastDisconnect?.error?.message, `(Status code: ${statusCode})`);

      if (shouldReconnect) {
        reconnectAttempts++;
        const delay = Math.min(reconnectAttempts * 2000, 30000);
        console.log(`[bot_whatsapp] Reconnecting in ${delay / 1000} seconds (Attempt #${reconnectAttempts})...`);
        setTimeout(() => initWhatsAppBot(supabase), delay);
      } else {
        console.error('[bot_whatsapp] Logged out from WhatsApp. Clear server/auth_info_baileys and restart to scan new QR code.');
      }
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      const isGroup = remoteJid.endsWith('@g.us');
      const senderPhone = (msg.key.participant || remoteJid).split('@')[0].replace(/[^0-9]/g, '');

      // Extract message text
      const messageContent = msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption || '';

      const text = messageContent.trim();
      if (!text) continue;

      // Group configuration & mention checks
      const botPrefix = (process.env.WA_BOT_PREFIX || '!bot').toLowerCase();
      const customBotName = (process.env.WA_BOT_NAME || '').toLowerCase();
      const botRawId = sock.user?.id || botJid || '';
      const botNumber = botRawId.split(':')[0].replace(/[^0-9]/g, '');
      const botLid = sock.user?.lid ? sock.user.lid.split(':')[0].replace(/[^0-9]/g, '') : '';
      const profileName = (sock.user?.name || '').toLowerCase();

      const contextInfo = msg.message.extendedTextMessage?.contextInfo;
      const mentionedJids = contextInfo?.mentionedJid || [];
      const quotedParticipant = (contextInfo?.participant || '').split('@')[0].replace(/[^0-9]/g, '');

      // 1. Native WhatsApp @mention (when user types '@' and selects bot contact from dropdown)
      const isMentionedByJid = (botNumber && mentionedJids.some(jid => jid.includes(botNumber))) ||
                               (botLid && mentionedJids.some(jid => jid.includes(botLid)));

      // 2. Direct reply / quote to a message sent by the bot
      const isReplyingToBot = botNumber && quotedParticipant === botNumber;

      // 3. Text prefix or text mention (e.g. !bot, @bot, @ALPBot, or custom handle)
      const lowerText = text.toLowerCase();
      const hasPrefix = botPrefix && lowerText.startsWith(botPrefix);
      const hasBotTag = lowerText.startsWith('@bot');
      const hasCustomNameTag = customBotName && lowerText.startsWith(`@${customBotName}`);
      const hasProfileNameTag = profileName && lowerText.startsWith(`@${profileName}`);

      let shouldProcess = false;
      let cleanQuery = text;

      if (isGroup) {
        // Enforce specific group if WA_AUTHORIZED_GROUP_ID is set
        const authorizedGroup = process.env.WA_AUTHORIZED_GROUP_ID;
        if (authorizedGroup && remoteJid !== authorizedGroup) {
          continue; // Ignore messages from unauthorized groups
        }

        if (isMentionedByJid || isReplyingToBot) {
          shouldProcess = true;
          // Strip any @phone, @bot, or @name mentions from text
          cleanQuery = text
            .replace(new RegExp(`@${botNumber}`, 'gi'), '')
            .replace(/@\d{7,16}/g, '')
            .replace(/@bot\b/gi, '')
            .trim();
          if (customBotName) {
            cleanQuery = cleanQuery.replace(new RegExp(`@${customBotName}\\b`, 'gi'), '').trim();
          }
          if (profileName) {
            cleanQuery = cleanQuery.replace(new RegExp(`@${profileName}\\b`, 'gi'), '').trim();
          }
        } else if (hasPrefix) {
          shouldProcess = true;
          cleanQuery = text.slice(botPrefix.length).trim();
        } else if (hasCustomNameTag) {
          shouldProcess = true;
          cleanQuery = text.slice(customBotName.length + 1).trim();
        } else if (hasProfileNameTag) {
          shouldProcess = true;
          cleanQuery = text.slice(profileName.length + 1).trim();
        } else if (hasBotTag) {
          shouldProcess = true;
          cleanQuery = text.slice(4).trim();
        }
      } else {
        // Direct Message (1-on-1): check authorized numbers list
        const authorizedNumbersRaw = process.env.WA_AUTHORIZED_PHONE_NUMBERS || '';
        const authorizedNumbers = authorizedNumbersRaw
          .split(',')
          .map(n => n.trim().replace(/[^0-9]/g, ''))
          .filter(Boolean);

        if (authorizedNumbers.length > 0 && !authorizedNumbers.includes(senderPhone)) {
          console.log(`[bot_whatsapp] Ignored unauthorized DM from ${senderPhone}`);
          await sock.sendMessage(remoteJid, {
            text: '⚠️ *Akses Terbatas:* Nomor WhatsApp Anda belum terdaftar sebagai staf resmi PT. Alpha Logistics Prakarsa. Silakan hubungi admin operasional untuk akses.'
          }, { quoted: msg });
          continue;
        }

        // In authorized DM, reply to all messages
        shouldProcess = true;
        if (cleanQuery.toLowerCase().startsWith(botPrefix)) {
          cleanQuery = cleanQuery.slice(botPrefix.length).trim();
        } else if (cleanQuery.toLowerCase().startsWith('@bot')) {
          cleanQuery = cleanQuery.slice(4).trim();
        }
      }

      if (!shouldProcess || !cleanQuery) continue;

      console.log(`[bot_whatsapp] Received message from ${senderPhone} in ${remoteJid}: "${cleanQuery}"`);

      // Send 'composing' presence indicator
      try {
        await sock.sendPresenceUpdate('composing', remoteJid);
      } catch (e) {}

      // Process message through Gemini agent
      try {
        const reply = await botAgent.processUserMessage(supabase, remoteJid, senderPhone, cleanQuery);
        if (reply && typeof reply === 'object' && reply.pdfBuffer) {
          // 1. Send confirmation message with Google Drive link first
          const textMsg = reply.text || '✅ Invoice berhasil diproses.';
          await sock.sendMessage(remoteJid, { text: textMsg }, { quoted: msg });

          // 2. Send PDF document attachment (ensuring Buffer type for Baileys)
          try {
            const docBuffer = Buffer.isBuffer(reply.pdfBuffer)
              ? reply.pdfBuffer
              : Buffer.from(reply.pdfBuffer);

            await sock.sendMessage(remoteJid, {
              document: docBuffer,
              mimetype: 'application/pdf',
              fileName: reply.fileName || 'invoice.pdf'
            });
          } catch (docErr) {
            console.warn('[bot_whatsapp] Gagal mengirim file PDF langsung ke WA:', docErr.message);
          }
        } else {
          const textMsg = (reply && typeof reply === 'object' && reply.text) ? reply.text : String(reply);
          await sock.sendMessage(remoteJid, { text: textMsg }, { quoted: msg });
        }
      } catch (err) {
        console.error('[bot_whatsapp] Error generating reply:', err);
        await sock.sendMessage(remoteJid, {
          text: `⚠️ Maaf, terjadi kesalahan saat memproses permintaan: ${err.message}`
        }, { quoted: msg });
      } finally {
        try {
          await sock.sendPresenceUpdate('paused', remoteJid);
        } catch (e) {}
      }
    }
  });

  return sock;
}

module.exports = {
  initWhatsAppBot,
  getBotStatus,
  getLatestQR,
  sendWhatsAppMessage
};
