const running = new Map();

module.exports = {
  config: {
    name: "spam",
    aliases: ["سبام", "sp"],
    version: "2.0.0",
    author: "shtot",
    countDown: 2,
    role: 1,
    shortDescription: "إرسال رسالة لا محدود",
    longDescription: "كيبقا يعاود يرسل نفس الرسالة حتى توقفو",
    category: "utility",
    guide: "{pn} [الرسالة]\n{pn} stop\nمثال: {pn} drari fin wslto"
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;

    // إيقاف
    if (args[0] === "stop" || args[0] === "off") {
      if (!running.has(threadID)) {
        return api.sendMessage("❌ ما كاين حتى إرسال خدام.", threadID);
      }

      clearInterval(running.get(threadID).timer);
      running.delete(threadID);

      return api.sendMessage("⛔ تم إيقاف السبام.", threadID);
    }

    // منع تشغيل أكثر من واحد
    if (running.has(threadID)) {
      return api.sendMessage("⚠️ راه السبام خدام دابا.\nاستعمل: spam stop", threadID);
    }

    // نجيبو الرسالة كاملة
    const message = args.join(" ") || "رسالة سبام";

    let count = 0;

    const timer = setInterval(async () => {
      if (!running.has(threadID)) return;

      count++;

      try {
        await api.sendMessage(`${message} [#${count}]`, threadID);
      } catch (err) {
        console.error(err);
        clearInterval(timer);
        running.delete(threadID);
        return api.sendMessage("❌ وقع خطأ. تم إيقاف السبام.", threadID);
      }
    }, 20000); // بدلت 2ث لـ 20ث باش نقصو البان

    running.set(threadID, { timer });

    api.sendMessage(
      `▶️ بدا السبام.\n⏱️ رسالة كل 20 ث.\n📌 لا محدود\n\n🛑 للتوقيف: spam stop`,
      threadID
    );
  }
};
