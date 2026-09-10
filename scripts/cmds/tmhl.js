const running = new Map();

module.exports = {
  config: {
    name: "skam",
    aliases: ["سكام", "sk"],
    version: "2.0.1",
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

      return api.sendMessage("⛔ تم إيقاف السكام.", threadID);
    }

    // منع تشغيل أكثر من واحد
    if (running.has(threadID)) {
      return api.sendMessage("⚠️ راه السكام خدام دابا.\nاستعمل: skam stop", threadID);
