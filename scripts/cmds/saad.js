module.exports = {
  config: {
    name: "nickall",
    aliases: ["كنية"],
    version: "1.0",
    author: "Shtot",
    role: 0,
    shortDescription: "Change all members' nicknames",
    longDescription: "Change the nickname of all members in the group",
    category: "group"
  },

  onStart: async function ({ api, event, args, message }) {
    const nickname = args.join(" ").trim();

    if (!nickname) {
      return message.reply("❌ Example: +nickall SHTOT");
    }

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.participantIDs;

      let success = 0;
      let failed = 0;

      for (const userID of members) {
        try {
          await new Promise((resolve, reject) => {
            api.changeNickname(
              nickname,
              event.threadID,
              userID,
              err => err ? reject(err) : resolve()
            );
          });

          success++;
        } catch (error) {
          failed++;
        }
      }

      return message.reply(
        `✅ Nickname changed!\n\n` +
        `👥 Members: ${members.length}\n` +
        `✔️ Success: ${success}\n` +
        `❌ Failed: ${failed}\n` +
        `🏷️ Nickname: ${nickname}`
      );

    } catch (error) {
      return message.reply("❌ Could not get the group members.");
    }
  }
};
