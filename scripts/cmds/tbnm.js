const running = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  config: {
    name: "niip",
    aliases: [],
    version: "1.0.0",
    author: "shtot",
    countDown: 5,
    role: 1,
    shortDescription: "إرسال تجريبي محدود",
    category: "fun"
  },

  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;

    // إيقاف الإرسال
    if (args[0] && args[0].toLowerCase() === "stop") {
      if (!running.has(threadID)) {
        return message.reply("❌ ما كاين حتى إرسال خدام.");
      }

      running.set(threadID, false);
      return message.reply("🛑 تم إيقاف niip.");
    }

    // منع تشغيل أكثر من عملية
    if (running.get(threadID)) {
      return message.reply(
        "⚠️ niip راه خدام دابا.\nكتب niip stop باش توقفو."
      );
    }

    running.set(threadID, true);

    await message.reply(
      "🚀 بدا الاختبار!\n" +
      "📦 الحد الأقصى: 20 رسالة\n" +
      "⏱️ الفرق بين الرسائل: 30 ثانية\n" +
      "🛑 للإيقاف: niip stop"
    );

    let sent = 0;

    try {
      for (let i = 1; i <= 20; i++) {

        if (!running.get(threadID)) {
          break;
        }

        await api.sendMessage(
          `🧪 niip اختبار ${i}/20`,
          threadID
        );

        sent++;

        // 30 ثانية بين كل رسالة
        if (i < 20) {
          await sleep(30000);
        }
      }
    } catch (err) {
      console.error("NIIP ERROR:", err);
    }

    running.delete(threadID);

    return message.reply(
      `✅ سالا الاختبار.\n\n` +
      `📨 المرسل: ${sent}/20`
    );
  }
};
