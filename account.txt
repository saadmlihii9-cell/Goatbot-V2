module.exports = {
  config: {
    name: "kinn",
    aliases: [],
    version: "1.0.0",
    author: "shtot",
    countDown: 5,
    role: 2,
    category: "admin",
    description: "تغيير كنية البوت في جميع الكروبات"
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const newNick = args.join(" ").trim();

    if (!newNick) {
      return api.sendMessage(
        "❌ كتب الكنية اللي بغيتي.\n\nمثال:\nkinn Saad",
        event.threadID
      );
    }

    try {
      const threadList = await threadsData.getAll();

      if (!threadList || threadList.length === 0) {
        return api.sendMessage("❌ ما لقيتش الكروبات.", event.threadID);
      }

      const botID = api.getCurrentUserID();

      let success = 0;
      let failed = 0;

      await api.sendMessage(
        `🔄 جاري تغيير كنية البوت إلى: ${newNick}\n📌 الكروبات: ${threadList.length}`,
        event.threadID
      );

      for (const thread of threadList) {
        const threadID = thread.threadID;

        try {
          await new Promise((resolve) => {
            api.changeNickname(
              newNick,
              threadID,
              botID,
              (err) => {
                if (err) failed++;
                else success++;
                resolve();
              }
            );
          });

          await new Promise(resolve => setTimeout(resolve, 800));

        } catch (e) {
          failed++;
        }
      }

      return api.sendMessage(
        `✅ سالينا تغيير الكنية.\n\n👤 الكنية: ${newNick}\n✅ نجحات: ${success}\n❌ فشلات: ${failed}`,
        event.threadID
      );

    } catch (error) {
      console.error("KINN ERROR:", error);

      return api.sendMessage(
        "❌ وقع خطأ أثناء محاولة تغيير الكنية.",
        event.threadID
      );
    }
  }
};
