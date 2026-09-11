module.exports = {
  config: {
    name: "msh",
    aliases: ["مسح", "mshnick"],
    version: "3.0.0",
    author: "shtot",
    countDown: 5,
    role: 1,
    shortDescription: "مسح كنيات أعضاء المجموعة",
    category: "group"
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;

    try {
      const info = await api.getThreadInfo(threadID);
      const members = info.participantIDs || [];

      // نجيب معلومات الكنيات
      const nicknames = info.nicknames || {};

      // غير اللي عندهم كنية
      const targets = members.filter(uid => {
        return nicknames[uid] && nicknames[uid].trim() !== "";
      });

      const total = targets.length;

      if (total === 0) {
        return api.sendMessage(
          "ℹ️ ماكاين حتى شي عضو عندو كنية فهاد المجموعة.",
          threadID
        );
      }

      // نخبر بعدد الكنيات قبل البداية
      await api.sendMessage(
        `🧹 غادي نبدا نمسح الكنيات...\n\n📊 عدد الكنيات اللي غادي تتمسح: ${total}\n\n⚡ السرعة: جوج كنيات كل ثانية`,
        threadID
      );

      let count = 0;

      // جوج كنيات فكل دفعة
      for (let i = 0; i < targets.length; i += 2) {
        const batch = targets.slice(i, i + 2);

        await Promise.all(
          batch.map(async uid => {
            try {
              await api.changeNickname("", threadID, uid);
              count++;
            } catch (err) {
              console.log(`تعذر مسح كنية ${uid}:`, err.message);
            }
          })
        );

        // ثانية وحدة بين كل دفعة
        if (i + 2 < targets.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await api.sendMessage(
        `✅ سالينا مسح الكنيات\n\n👥 تم مسح: ${count} كنية من أصل ${total}`,
        threadID
      );

    } catch (err) {
      console.error(err);

      api.sendMessage(
        "❌ وقع خطأ أثناء جلب معلومات المجموعة.",
        threadID
      );
    }
  }
};
