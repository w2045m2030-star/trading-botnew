import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

// === 1️⃣ إعدادات بوت التليجرام ===
const TELEGRAM_BOT_TOKEN = '8492077880:AAFO6r_G-bWcpGrY2R49Iyz5V-jDQuTyTXM'; // ضع آخر Token للبوت هنا
const CHAT_ID = '8080222077';

// === 2️⃣ Middleware لتحليل JSON ===
app.use(express.json());

// === 3️⃣ Queue لإرسال الرسائل بشكل متسلسل ===
let queue = [];
let isSending = false;

// === 4️⃣ استقبال إشارات TradingView ===
app.post('/webhook', (req, res) => {
  const data = req.body;

  // تنسيق الرسالة بطريقة واضحة
  const message = `
📢 إشارة جديدة من TradingView:
🔹 الزوج: ${data.symbol || 'N/A'}
🔹 العملية: ${data.action || 'N/A'}
🔹 السعر: ${data.price || 'N/A'}
🔹 TP: ${data.tp || 'N/A'}
🔹 SL: ${data.sl || 'N/A'}
`;

  console.log("وصلت إشارة جديدة:", message.trim());
  queue.push(message);
  res.status(200).send('تم استلام الإشارة ✅');
  processQueue();
});

// === 5️⃣ معالجة Queue ===
async function processQueue() {
  if (isSending || queue.length === 0) return;
  isSending = true;

  while (queue.length > 0) {
    const msg = queue.shift();
    await sendToTelegram(msg);
    await delay(1500); // فترة قصيرة لتجنب حظر Telegram
  }

  isSending = false;
}

// === 6️⃣ إرسال الرسالة للتليجرام مع فحص الأخطاء ===
async function sendToTelegram(message) {
  try {
    console.log("إرسال الرسالة للتليجرام:", message.trim());
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    const data = await response.json();
    if (!data.ok) throw new Error(JSON.stringify(data));

    console.log("تم الإرسال بنجاح ✅");
  } catch (err) {
    console.error("خطأ في الإرسال للتليجرام:", err);
  }
}

// === 7️⃣ دالة تأخير ===
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === 8️⃣ صفحة اختبارية للتأكد من عمل البوت ===
app.get('/test', (req, res) => {
  res.send('البوت يعمل بنجاح ✅');
});

// === 9️⃣ تشغيل السيرفر ===
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
