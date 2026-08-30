const running = new Map();
const groupLocks = new Map();
const messageLoops = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  config: {
    name: "nickset",
    aliases: ["nick"],
    version: "5.0.0",
    author: "shtot",
    countDown: 3,
    role: 1,
    shortDescription: "Group protection and repeated messages",
    category: "group",
    guide: {
      en:
        "{pn} <nickname>\n" +
        "{pn} clear\n" +
        "{pn} lock\n" +
        "{pn} unlock\n" +
        "{pn} off\n" +
        "/msg <cycles> <message>\n" +
        "/msgstop"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const threadID = event.threadID;
    const action = args[0]?.toLowerCase();

    // =====================================
    // MESSAGE LOOP
    // /msg 5 Hello
    //
    // Each cycle = 10 messages
    // 5 seconds between cycles
    // =====================================
    if (action === "msg") {
      const cycles = parseInt(args[1]);

      if (
        isNaN(cycles) ||
        cycles < 1 ||
        cycles > 10 ||
        args.length < 3
      ) {
        return message.reply(
          "❌ Usage:\n\n" +
          "/msg 5 Hello\n\n" +
          "Each cycle sends 10 messages.\n" +
          "Delay between cycles: 5 seconds.\n" +
          "Maximum: 10 cycles."
        );
      }

      if (messageLoops.has(threadID)) {
        return message.reply(
          "⚠️ A message process is already running."
        );
      }

      const text = args.slice(2).join(" ");

      messageLoops.set(threadID, true);

      await message.reply(
        `🚀 Starting message system.\n` +
        `🔁 Cycles: ${cycles}\n` +
        `📨 Messages per cycle: 10\n` +
        `⏱️ Delay: 5 seconds`
      );

      for (let cycle = 1; cycle <= cycles; cycle++) {

        // Stop check
        if (!messageLoops.get(threadID)) {
          messageLoops.delete(threadID);
          return;
        }

        // Send 10 messages
        for (let i = 1; i <= 10; i++) {

          if (!messageLoops.get(threadID)) {
            messageLoops.delete(threadID);
            return;
          }

          try {
            await message.reply(text);
          } catch (err) {
            console.log(
              "Message send error:",
              err.message
            );

            messageLoops.delete(threadID);
            return;
          }

          // Small delay between messages
          await sleep(300);
        }

        // Wait 5 seconds before next group of 10
        if (cycle < cycles) {
          await sleep(5000);
        }
      }

      messageLoops.delete(threadID);

      return message.reply(
        "✅ Message process finished."
      );
    }

    // =====================================
    // STOP MESSAGE LOOP
    // =====================================
    if (action === "msgstop") {

      if (!messageLoops.has(threadID)) {
        return message.reply(
          "ℹ️ No message process is running."
        );
      }

      messageLoops.set(threadID, false);

      return message.reply(
        "🛑 Message process stopped."
      );
    }

    // =====================================
    // STOP NICKNAME PROCESS
    // =====================================
    if (action === "off") {
      running.set(threadID, false);

      return message.reply(
        "🛑 Nickname process stopped."
      );
    }

    // =====================================
    // UNLOCK GROUP
    // =====================================
    if (action === "unlock") {
      groupLocks.delete(threadID);

      return message.reply(
        "🔓 Group protection disabled."
      );
    }

    // =====================================
    // LOCK GROUP
    // =====================================
    if (action === "lock") {
      try {
        const info = await api.getThreadInfo(threadID);

        const savedNicknames = {};

        for (const uid of info.participantIDs) {
          savedNicknames[uid] =
            info.nicknames?.[uid] || "";
        }

        groupLocks.set(threadID, {
          nicknames: savedNicknames,
          threadName: info.threadName || "",
          image:
            info.imageSrc ||
            info.imageUrl ||
            info.threadImage ||
            null
        });

        return message.reply(
          "🔒 Group protection enabled.\n\n" +
          "🛡️ Nicknames: LOCKED\n" +
          "🛡️ Group name: LOCKED\n" +
          "🛡️ Group image: LOCKED"
        );

      } catch (err) {
        console.error(err);

        return message.reply(
          "❌ Could not enable protection."
        );
      }
    }

    // =====================================
    // CLEAR / SET NICKNAMES
    // =====================================
    const clear = action === "clear";

    if (!clear && args.length === 0) {
      return message.reply(
        "❌ Commands:\n\n" +
        "/nickset Shtot\n" +
        "/nickset clear\n" +
        "/nickset lock\n" +
        "/nickset unlock\n" +
        "/nickset off\n\n" +
        "📨 Message system:\n" +
        "/msg 5 Hello\n" +
        "/msgstop"
      );
    }

    if (running.get(threadID)) {
      return message.reply(
        "⚠️ A nickname process is already running."
      );
    }

    running.set(threadID, true);

    try {
      const info = await api.getThreadInfo(threadID);
      const members = info.participantIDs;

      if (clear) {
        const savedNicknames = {};

        for (const uid of members) {
          savedNicknames[uid] =
            info.nicknames?.[uid] || "";
        }

        const oldLock =
          groupLocks.get(threadID);

        groupLocks.set(threadID, {
          nicknames: savedNicknames,
          threadName:
            oldLock?.threadName ||
            info.threadName ||
            "",
          image:
            oldLock?.image ||
            info.imageSrc ||
            info.imageUrl ||
            info.threadImage ||
            null
        });
      }

      const newNickname = args.join(" ");

      await message.reply(
        clear
          ? `🧹 Clearing nicknames of ${members.length} members...`
          : `🚀 Changing nicknames of ${members.length} members...`
      );

      // 5 members per batch
      for (let i = 0; i < members.length; i += 5) {

        if (running.get(threadID) === false) {
          running.delete(threadID);

          return message.reply(
            "🛑 Process stopped."
          );
        }

        const batch = members.slice(i, i + 5);

        await Promise.all(
          batch.map(async uid => {
            try {
              await api.changeNickname(
                clear ? "" : newNickname,
                threadID,
                uid
              );
            } catch (err) {
              console.log(
                `Failed nickname for ${uid}:`,
                err.message
              );
            }
          })
        );

        if (i + 5 < members.length) {
          await sleep(500);
        }
      }

      running.delete(threadID);

      return message.reply(
        clear
          ? "✅ All nicknames cleared."
          : "✅ All nicknames changed."
      );

    } catch (err) {
      running.delete(threadID);

      console.error(err);

      return message.reply(
        "❌ An error occurred."
      );
    }
  },

  // =====================================
  // GROUP PROTECTION EVENTS
  // =====================================
  onEvent: async function ({ event, api }) {
    const threadID = event.threadID;

    if (!groupLocks.has(threadID)) {
      return;
    }

    const lock = groupLocks.get(threadID);

    try {

      // GROUP NAME
      if (event.logMessageType === "log:thread-name") {

        const info =
          await api.getThreadInfo(threadID);

        const currentName =
          info.threadName || "";

        const savedName =
          lock.threadName || "";

        if (
          savedName &&
          currentName !== savedName
        ) {
          try {
            await api.setTitle(
              savedName,
              threadID
            );

            console.log(
              "[LOCK] Group name restored."
            );

          } catch (err) {
            console.log(
              "Name restore error:",
              err.message
            );
          }
        }

        return;
      }

      // GROUP IMAGE
      if (event.logMessageType === "log:thread-image") {
        console.log(
          "[LOCK] Group image change detected."
        );

        // Image restoration depends
        // on the FCA/GoatBot version.
        return;
      }

      // Ignore join / leave events
      if (
        event.logMessageType === "log:subscribe" ||
        event.logMessageType === "log:unsubscribe"
      ) {
        return;
      }

      // NICKNAME PROTECTION
      const info =
        await api.getThreadInfo(threadID);

      const savedNicknames =
        lock.nicknames || {};

      for (const uid of info.participantIDs) {

        if (!(uid in savedNicknames)) {
          continue;
        }

        const current =
          info.nicknames?.[uid] || "";

        const original =
          savedNicknames[uid] || "";

        if (current !== original) {

          try {
            await api.changeNickname(
              original,
              threadID,
              uid
            );

            console.log(
              `[LOCK] Nickname restored for ${uid}`
            );

          } catch (err) {
            console.log(
              `Nickname restore error for ${uid}:`,
              err.message
            );
          }
        }
      }

    } catch (err) {
      console.log(
        "Protection error:",
        err.message
      );
    }
  }
};
