const running = new Map();

module.exports = {
  config: {
    name: "swww",
    aliases: [],
    version: "1.1.0",
    author: "shtot",
    countDown: 3,
    role: 1,
    shortDescription: "إرسال متكرر لا محدود",
    category: "fun"
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;

    // إيقاف
    if (args[0] === "stop") {
      const timer = running.get(threadID);

      if (!timer) {
        return api.sendMessage("❌ ما كاين حتى إرسال خدام.", threadID);
      }

      clearInterval(timer);
      running.delete(threadID);

      return api.sendMessage("✅ صافي، تحبس الإرسال.", threadID);
    }

    // منع تشغيل أكثر من واحد
    if (running.has(threadID)) {
      return api.sendMessage(
        "⚠️ راه swww خدام دابا.\nاستعمل: swww stop",
        threadID
      );
    }

    const text = args.join(" ") || "رسالة تجريبية من swww";
    let count = 0;

    api.sendMessage(
      `✅ بدا الإرسال اللانهائي.\n⏱️ كل 30 ثانية\n🛑 للإيقاف: swww stop`,
      threadID
    );

    const timer = setInterval(() => {
      count++;
      api.sendMessage(`${text}\n📨 ${count}`, threadID);
    }, 30000);

    running.set(threadID, timer);
  }
};
