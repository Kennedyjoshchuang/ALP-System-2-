require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const botTools = require('./bot_tools.cjs');

// In-memory chat history per chatId to maintain multi-turn context (e.g. drafting -> confirm)
const chatSessions = new Map();

function getChatSession(chatId) {
  if (!chatSessions.has(chatId)) {
    chatSessions.set(chatId, { history: [], lastActivity: Date.now() });
  }
  const session = chatSessions.get(chatId);
  session.lastActivity = Date.now();
  return session;
}

// Clean old sessions after 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, session] of chatSessions.entries()) {
    if (session.lastActivity < cutoff) {
      chatSessions.delete(id);
    }
  }
}, 15 * 60 * 1000);

const toolDeclarations = [
  {
    name: 'getShippingSchedules',
    description: 'Cek jadwal kapal, perkiraan ETD, ETA, nomor kontainer, dan status pengiriman Job Orders.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Nama customer (opsional/filter)' },
        vesselName: { type: 'STRING', description: 'Nama kapal / vessel (opsional/filter)' },
        status: { type: 'STRING', description: 'Status pengiriman, contoh: pending, dispatched, done (opsional)' },
        limit: { type: 'INTEGER', description: 'Jumlah data maksimal yang diambil, default 5' }
      }
    }
  },
  {
    name: 'getCustomerRates',
    description: 'Cari riwayat rate atau harga transaksi sebelumnya untuk customer tertentu dari job order dan invoice yang sudah terlaksana.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Nama customer' },
        serviceDescription: { type: 'STRING', description: 'Deskripsi rute/muatan/layanan, contoh: 20ft Jakarta Surabaya (opsional)' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'getHistoricalMinMaxRates',
    description: 'Hitung dan bandingkan rate terendah, rate tertinggi, rata-rata, dan rate transaksi terakhir untuk customer tertentu.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Nama customer' },
        serviceDescription: { type: 'STRING', description: 'Filter deskripsi layanan (opsional)' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'getExpectedSales',
    description: 'Cek total expected sales / potensi nilai penjualan dari seluruh quotation atau kontrak aktif untuk customer tertentu atau semua customer.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Nama customer (opsional, jika kosong tampilkan keseluruhan)' }
      }
    }
  },
  {
    name: 'draftQuotation',
    description: 'Buat draft penawaran harga (Quotation) baru. Ini HANYA membuat preview dan draft sementara, TIDAK langsung menerbitkan sampai user mengonfirmasi.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Nama customer' },
        items: {
          type: 'ARRAY',
          description: 'Daftar item / muatan yang ditawarkan',
          items: {
            type: 'OBJECT',
            properties: {
              description: { type: 'STRING', description: 'Deskripsi layanan / rute / tipe kontainer' },
              qty: { type: 'NUMBER', description: 'Jumlah kontainer / unit' },
              price: { type: 'NUMBER', description: 'Harga satuan (IDR)' }
            },
            required: ['description', 'price']
          }
        },
        notes: { type: 'STRING', description: 'Catatan tambahan seperti syarat demurrage atau masa berlaku' },
        pic: { type: 'STRING', description: 'Nama PIC customer jika ada' },
        validDays: { type: 'INTEGER', description: 'Jumlah hari masa berlaku penawaran, default 30 hari' }
      },
      required: ['customerName', 'items']
    }
  },
  {
    name: 'draftInvoice',
    description: 'Buat draft tagihan (Invoice) baru. Ini HANYA membuat preview dan draft sementara, TIDAK langsung menerbitkan sampai user mengonfirmasi.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING', description: 'Nama customer' },
        items: {
          type: 'ARRAY',
          description: 'Daftar item tagihan',
          items: {
            type: 'OBJECT',
            properties: {
              description: { type: 'STRING', description: 'Deskripsi tagihan / biaya pengiriman' },
              qty: { type: 'NUMBER', description: 'Kuantitas' },
              rate: { type: 'NUMBER', description: 'Tarif / harga per unit (IDR)' }
            },
            required: ['description', 'rate']
          }
        },
        joId: { type: 'STRING', description: 'Nomor Job Order referensi jika ada' },
        notes: { type: 'STRING', description: 'Catatan invoice' },
        taxRate: { type: 'NUMBER', description: 'Tarif pajak PPN (contoh: 0.011 untuk 1.1%, atau 0 jika non-PPN)' }
      },
      required: ['customerName', 'items']
    }
  },
  {
    name: 'printInvoiceFromSheet',
    description: 'Cari data Job Order di Google Sheets berdasarkan nomor invoice (contoh: "125", "101", atau "101/ALP-INV/X/2026") dan buatkan draft preview untuk dicetak menjadi PDF dan diunggah ke Google Drive.',
    parameters: {
      type: 'OBJECT',
      properties: {
        invoiceNumber: {
          type: 'STRING',
          description: 'Nomor invoice atau angka prefix invoice pada Google Sheets, contoh: "125", "101", atau "101/ALP-INV/X/2026"'
        }
      },
      required: ['invoiceNumber']
    }
  },
  {
    name: 'printQuotationFromSheet',
    description: 'Cari data Job Order di Google Sheets berdasarkan nomor JO (contoh: "05003", "JO.2026.05003", atau nama customer) dan buatkan draft preview penawaran harga (Quotation) resmi ALP untuk dibuatkan Google Doc di Google Drive.',
    parameters: {
      type: 'OBJECT',
      properties: {
        joNumber: {
          type: 'STRING',
          description: 'Nomor Job Order, nomor referensi JO di Google Sheets, contoh: "05003", "JO.2026.05003", atau nama customer.'
        },
        pic: {
          type: 'STRING',
          description: 'Nama PIC customer (contoh: "Bu Wiwi / Pak Tedy"). Jika tidak disertakan, sistem default ke "Bapak/Ibu".'
        }
      },
      required: ['joNumber']
    }
  },
  {
    name: 'setDraftPic',
    description: 'Perbarui nama PIC pada draft quotation yang sedang aktif sebelum konfirmasi.',
    parameters: {
      type: 'OBJECT',
      properties: {
        pic: { type: 'STRING', description: 'Nama PIC customer yang baru' },
        draftId: { type: 'STRING', description: 'ID draft quotation (opsional, jika kosong menggunakan draft terakhir)' }
      },
      required: ['pic']
    }
  },
  {
    name: 'confirmDraft',
    description: 'Eksekusi konfirmasi atau pembatalan draft Quotation atau Invoice setelah user melihat preview dan setuju.',
    parameters: {
      type: 'OBJECT',
      properties: {
        draftId: { type: 'STRING', description: 'ID draft, contoh DRAFT-Q-1234 atau DRAFT-INV-1234. Jika kosong, sistem otomatis mengambil draft terakhir.' },
        action: { type: 'STRING', description: 'Tindakan: "confirm" untuk menerbitkan, atau "cancel" untuk membatalkan.' }
      },
      required: ['action']
    }
  },
  {
    name: 'createReminder',
    description: 'Buat pengingat (reminder) otomatis yang akan dikirim bot ke grup atau chat ini pada waktu tertentu.',
    parameters: {
      type: 'OBJECT',
      properties: {
        message: { type: 'STRING', description: 'Isi pengingat, contoh: "Cek BL Kapal Meratus"' },
        remindAt: { type: 'STRING', description: 'Waktu pengingat dalam format ISO 8601 (UTC atau timezone Asia/Jakarta +07:00)' }
      },
      required: ['message', 'remindAt']
    }
  }
];

function buildSystemInstruction() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  const timeStr = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });

  return `Kamu adalah bot operasional internal untuk tim / staf PT. Alpha Logistics Prakarsa (ALP) di WhatsApp.
Waktu sistem saat ini: ${dateStr}, pukul ${timeStr} WIB.

ATURAN KOMUNIKASI & AUDIENS:
1. PENTING: Pengguna yang berinteraksi denganmu adalah KARYAWAN / STAF INTERNAL ALP, BUKAN customer.
   - JANGAN gunakan salam customer service seperti "Halo Bapak/Ibu pelanggan setia", "Terima kasih telah menghubungi PT. Alpha Logistics Prakarsa", atau "Ada yang bisa kami bantu?".
   - Berikan jawaban yang to the point, ringkas, padat, dan operasional layaknya rekan kerja internal.
2. BAHASA: Jawablah SELALU menggunakan BAHASA YANG SAMA DENGAN PERTANYAAN USER.
   - Jika ditanya dalam Bahasa Indonesia -> Jawab dalam Bahasa Indonesia.
   - Jika ditanya dalam Bahasa Inggris -> Jawab dalam Bahasa Inggris.
   - Jika ditanya dalam bahasa lain -> Jawab dalam bahasa tersebut.
3. FORMAT:
   - Gunakan format WhatsApp: *bold* untuk angka/nama kapal/customer/ID, bullet point (•) untuk daftar.
   - Format mata uang Rupiah secara rapi (contoh: Rp 15.000.000).

TUGAS OPERASIONAL:
1. Cek jadwal kapal, status job orders, ETD, ETA, dan nomor kontainer.
2. Cek histori rate customer, rate terendah, tertinggi, rata-rata, dan rate terbaru.
3. Cek total expected sales dari kontrak/quotation aktif.
4. Input Quotation / Invoice: Selalu panggil 'draftQuotation' atau 'draftInvoice' terlebih dahulu untuk menampilkan preview. Hanya panggil 'confirmDraft' setelah user mengonfirmasi ("konfirmasi", "ok", "confirm").
5. Cetak Invoice dari Google Sheets: Jika staf meminta mencetak invoice berdasarkan nomor (contoh: "print invoice 125", "cetak invoice 101"), panggil 'printInvoiceFromSheet' untuk mengambil data dari Google Sheets dan menampilkan preview draft resmi.
6. Buat / Cetak Quotation dari Google Sheets: Jika staf meminta membuat quotation berdasarkan nomor Job Order (contoh: "print quotation 05003", "buat quotation 05003", "cetak quotation JO.2026.05003"), panggil 'printQuotationFromSheet' untuk mengambil data dari Google Sheets dan menampilkan preview penawaran resmi ALP. Tanyakan atau perbarui PIC jika diinginkan (default ke "Bapak/Ibu").
7. Pengingat: Panggil 'createReminder' jika diminta mengingatkan jadwal.`;
}

// Model fallback cascade: defaults to gemini-3.5-flash-lite, fallback to gemini-3.1-flash-lite
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite'
];

/**
 * Process a message with Gemini
 */
async function processUserMessage(supabase, chatId, userPhone, userText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '❌ *Error Konfigurasi:* GEMINI_API_KEY belum disetel di file `.env`. Silakan tambahkan API key Gemini Anda terlebih dahulu.';
  }

  // Quick shortcut handler for direct confirmation without LLM overhead
  const trimmed = userText.trim().toLowerCase();

  // Quick shortcut for printing invoice from Google Sheets (e.g. "print invoice 125" or "cetak invoice 101")
  const printMatch = trimmed.match(/^(?:print|cetak|buatkan|buat)\s+invoice\s+([a-z0-9/_-]+)/i);
  if (printMatch) {
    const invNum = printMatch[1];
    const res = await botTools.printInvoiceFromSheet(supabase, { invoiceNumber: invNum });
    return res.preview || res.message;
  }

  // Quick shortcut for printing quotation from Google Sheets (e.g. "print quotation 05003" or "buat quotation 05003")
  const quoteMatch = trimmed.match(/^(?:print|cetak|buatkan|buat)\s+quotation\s+([a-z0-9/._-]+)(?:\s+(?:pic|attn)\s+(.+))?/i);
  if (quoteMatch) {
    const joNum = quoteMatch[1];
    const pic = quoteMatch[2] ? quoteMatch[2].trim() : null;
    const res = await botTools.printQuotationFromSheet(supabase, { joNumber: joNum, pic });
    return res.preview || res.message;
  }

  // Quick shortcut for updating PIC on active quotation draft: e.g. "pic: Bu Wiwi" or "pic Bu Wiwi / Pak Tedy"
  const picMatch = trimmed.match(/^pic[:\s]+(.+)/i);
  if (picMatch) {
    const picName = picMatch[1].trim();
    const res = await botTools.setDraftPic(supabase, { pic: picName });
    return res.message;
  }

  if (trimmed === 'konfirmasi' || trimmed === 'confirm' || trimmed.startsWith('konfirmasi ') || trimmed.startsWith('confirm ')) {
    const rawParts = userText.trim().split(/\s+/);
    const draftId = rawParts[1] ? rawParts[1].toUpperCase() : null;
    const res = await botTools.confirmDraft(supabase, { draftId, action: 'confirm' });
    if (res.pdfBuffer) {
      return { text: res.message, pdfBuffer: res.pdfBuffer, fileName: res.fileName };
    }
    return res.message;
  }
  if (trimmed === 'batal' || trimmed === 'cancel' || trimmed.startsWith('batal ') || trimmed.startsWith('cancel ')) {
    const parts = trimmed.split(/\s+/);
    const draftId = parts[1] || null;
    const res = await botTools.confirmDraft(supabase, { draftId, action: 'cancel' });
    return res.message;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const session = getChatSession(chatId);
  const recentHistory = session.history.slice(-8);

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: buildSystemInstruction()
      });

      const chat = model.startChat({ history: recentHistory });
      const result = await chat.sendMessage(userText);
      const response = result.response;
      const calls = typeof response.functionCalls === 'function' ? response.functionCalls() : [];

      let replyText = '';

      if (calls && calls.length > 0) {
        const call = calls[0];
        const functionName = call.name;
        const functionArgs = call.args || {};

        let toolOutput = null;

        if (functionName === 'getShippingSchedules') {
          toolOutput = await botTools.getShippingSchedules(supabase, functionArgs);
        } else if (functionName === 'getCustomerRates') {
          toolOutput = await botTools.getCustomerRates(supabase, functionArgs);
        } else if (functionName === 'getHistoricalMinMaxRates') {
          toolOutput = await botTools.getHistoricalMinMaxRates(supabase, functionArgs);
        } else if (functionName === 'getExpectedSales') {
          toolOutput = await botTools.getExpectedSales(supabase, functionArgs);
        } else if (functionName === 'draftQuotation') {
          toolOutput = await botTools.draftQuotation(supabase, functionArgs);
          replyText = toolOutput.preview;
        } else if (functionName === 'draftInvoice') {
          toolOutput = await botTools.draftInvoice(supabase, functionArgs);
          replyText = toolOutput.preview;
        } else if (functionName === 'printInvoiceFromSheet') {
          toolOutput = await botTools.printInvoiceFromSheet(supabase, functionArgs);
          replyText = toolOutput.preview || toolOutput.message;
        } else if (functionName === 'printQuotationFromSheet') {
          toolOutput = await botTools.printQuotationFromSheet(supabase, functionArgs);
          replyText = toolOutput.preview || toolOutput.message;
        } else if (functionName === 'setDraftPic') {
          toolOutput = await botTools.setDraftPic(supabase, functionArgs);
          replyText = toolOutput.message;
        } else if (functionName === 'confirmDraft') {
          toolOutput = await botTools.confirmDraft(supabase, functionArgs);
          if (toolOutput.pdfBuffer) {
            return { text: toolOutput.message, pdfBuffer: toolOutput.pdfBuffer, fileName: toolOutput.fileName };
          }
          replyText = toolOutput.message;
        } else if (functionName === 'createReminder') {
          toolOutput = await botTools.createReminder(supabase, {
            chatId,
            creatorPhone: userPhone,
            message: functionArgs.message,
            remindAt: functionArgs.remindAt
          });
          replyText = toolOutput.message;
        }

        // If not already formatted by draft/reminder tools, format the data using Gemini
        if (!replyText) {
          const formatter = genAI.getGenerativeModel({ model: modelName });
          const formatPrompt = `
You are an internal operations chatbot for PT. Alpha Logistics Prakarsa (ALP).
A team member asked: "${userText}"
Data retrieved from the database:
${JSON.stringify(toolOutput, null, 2)}

CRITICAL INSTRUCTIONS:
1. LANGUAGE: Respond in the EXACT SAME LANGUAGE as the question above.
   - If the user asked in English, your ENTIRE response must be in English.
   - If the user asked in Indonesian, your ENTIRE response must be in Indonesian.
2. AUDIENCE: The recipient is an INTERNAL EMPLOYEE / COLLEAGUE, NOT a customer. Do NOT include customer service greetings (e.g., "Halo Bapak/Ibu", "Thank you for contacting us", "How can I help you?"). Present the data directly, concisely, and factually.
3. FORMAT: Use clean WhatsApp markdown (*bold* for key numbers/IDs, bullet points •, and neat currency format like Rp 15.000.000).
          `;
          const formatRes = await formatter.generateContent(formatPrompt);
          replyText = formatRes.response.text();
        }
      } else {
        replyText = response.text();
      }

      // Update session history
      session.history.push({ role: 'user', parts: [{ text: userText }] });
      session.history.push({ role: 'model', parts: [{ text: replyText }] });

      return replyText;
    } catch (err) {
      lastError = err;
      const isQuotaOrLimit = err.message && (
        err.message.includes('429') ||
        err.message.includes('ResourceExhausted') ||
        err.message.includes('RESOURCE_EXHAUSTED') ||
        err.message.includes('quota') ||
        err.message.includes('rate limit') ||
        err.message.includes('503') ||
        err.message.includes('high demand') ||
        err.message.includes('404') ||
        err.message.includes('no longer available')
      );

      if (isQuotaOrLimit) {
        console.warn(`[bot_agent] Quota or service issue on ${modelName} (${err.message.slice(0, 80)}). Retrying with fallback model...`);
        continue;
      } else {
        console.error(`[bot_agent] Error with model ${modelName}:`, err.message);
        break;
      }
    }
  }

  console.error('[bot_agent] All candidate models failed:', lastError);
  if (lastError && lastError.message && lastError.message.includes('429')) {
    return '⏳ *Sistem sedang sibuk:* Batas kuota gratis tercapai untuk sementara. Mohon tunggu beberapa detik lalu coba lagi.';
  }
  return `⚠️ Maaf, terjadi kendala saat memproses permintaan: ${lastError ? lastError.message : 'Unknown error'}`;
}

module.exports = {
  processUserMessage
};
