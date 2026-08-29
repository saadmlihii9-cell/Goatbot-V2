module.exports.config = {
  name: "change nickname",
  version: "1.0.0",
  hasPermission: 1,
  credits: "إسماعيل",
  description: "تغيير كنية جميع أعضاء المجموعة",
  commandCategory: "إدارة المجموعة",
  usages: "change nickname [الكنية]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  if (!event.isGroup) {
    return api.sendMessage(
      "❌ هذا الأمر يعمل داخل المجموعات فقط.",
      event.threadID
    );
  }

  const nickname = args.join(" ").trim();

  if (!nickname) {
    return api.sendMessage(
      "⚠️ طريقة الاستعمال:\nchange nickname [الكنية]\n\nمثال:\nchange nickname KING",
      event.threadID
    );
  }

  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo.participantIDs;

    let success = 0;
    let failed = 0;

    for (const userID of members) {
      try {
        await api.changeNickname(
          nickname,
          event.threadID,
          userID
        );
        success++;
      } catch (error) {
        failed++;
      }
    }

    return api.sendMessage(
      `✅ تم تغيير كنية الأعضاء.\n\n` +
      `👥 عدد الأعضاء: ${members.length}\n` +
      `✅ نجح: ${success}\n` +
      `❌ فشل: ${failed}\n` +
      `🏷️ الكنية: ${nickname}`,
      event.threadID
    );

  } catch (error) {
    console.error(error);

    return api.sendMessage(
      "❌ وقع خطأ أثناء محاولة تغيير الكنيات. تأكد أن البوت عنده صلاحية إدارة المجموعة.",
      event.threadID
    );
  }
};
