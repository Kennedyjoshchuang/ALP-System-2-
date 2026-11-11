const cron = require('node-cron');
const botTools = require('./bot_tools.cjs');

let scheduledJob = null;

function startReminderScheduler(supabase, sendWhatsAppMessage) {
  if (scheduledJob) {
    scheduledJob.stop();
  }

  console.log('[bot_scheduler] Reminder worker started (checking every 60s)...');

  scheduledJob = cron.schedule('* * * * *', async () => {
    try {
      const dueList = await botTools.getDueReminders(supabase);
      if (!dueList || dueList.length === 0) return;

      console.log(`[bot_scheduler] Found ${dueList.length} due reminder(s).`);

      for (const item of dueList) {
        const creatorTag = item.creator_phone ? `@${item.creator_phone.replace(/[^0-9]/g, '')}` : 'Sistem';
        const formattedMsg = `⏰ *PENGINGAT OTOMATIS ALP*\n\n` +
          `*Pesan:* ${item.message}\n` +
          `*Diminta oleh:* ${creatorTag}\n` +
          `*ID:* ${item.id}`;

        if (typeof sendWhatsAppMessage === 'function') {
          await sendWhatsAppMessage(item.chat_id, formattedMsg);
          console.log(`[bot_scheduler] Reminder ${item.id} sent to ${item.chat_id}`);
        } else {
          console.warn(`[bot_scheduler] WhatsApp message dispatcher not available for reminder ${item.id}`);
        }

        await botTools.markReminderSent(supabase, item.id);
      }
    } catch (err) {
      console.error('[bot_scheduler] Error checking reminders:', err.message);
    }
  });

  return scheduledJob;
}

function stopReminderScheduler() {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    console.log('[bot_scheduler] Reminder worker stopped.');
  }
}

module.exports = {
  startReminderScheduler,
  stopReminderScheduler
};
