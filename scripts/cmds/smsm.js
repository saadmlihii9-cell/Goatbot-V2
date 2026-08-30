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
    version: "6.0.0",
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
        "{pn} lockname\n" +
        "{pn} unlockname\n" +
        "{pn} lockimage\n" +
        "{pn} unlockimage\n" +
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

        if (!messageLoops.get(threadID)) {
          messageLoops.delete(threadID);
          return;
        }

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

          await sleep(300);
        }

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
    // UNLOCK EVERYTHING
    // =====================================

    if (action === "unlock") {

      const oldLock = groupLocks.get(threadID);

      if (!oldLock) {
        return message.reply(
          "ℹ️ Group protection is not enabled."
        );
      }

      groupLocks.delete(threadID);

      return message.reply(
        "🔓 Group protection disabled.\n\n" +
        "Nicknames: UNLOCKED\n" +
        "Group name: UNLOCKED\n" +
        "Group image: UNLOCKED"
      );
    }

    // =====================================
    // LOCK EVERYTHING
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

          threadName:
            info.threadName || "",

          image:
            info.imageSrc ||
            info.imageUrl ||
            info.threadImage ||
            null,

          lockName: true,
          lockImage: true,
          lockNicknames: true
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
    // LOCK GROUP NAME ONLY
    // =====================================

    if (action === "lockname") {

      try {
        const info = await api.getThreadInfo(threadID);

        const oldLock =
          groupLocks.get(threadID) || {};

        groupLocks.set(threadID, {
          ...oldLock,

          threadName:
            info.threadName || "",

          nicknames:
            oldLock.nicknames || {},

          image:
            oldLock.image ||
            info.imageSrc ||
            info.imageUrl ||
            info.threadImage ||
            null,

          lockName: true
        });

        return message.reply(
          "🔒 Group name protection enabled."
        );

      } catch (err) {
        console.log(err);

        return message.reply(
          "❌ Could not lock group name."
        );
      }
    }

    // =====================================
    // UNLOCK GROUP NAME
    // =====================================

    if (action === "unlockname") {

      const lock =
        groupLocks.get(threadID);

      if (!lock) {
        return message.reply(
          "ℹ️ No group protection is enabled."
        );
      }

      lock.lockName = false;

      if (!lock.lockImage && !lock.lockNicknames) {
        groupLocks.delete(threadID);
      }

      return message.reply(
        "🔓 Group name protection disabled."
      );
    }

    // =====================================
    // LOCK GROUP IMAGE
    // =====================================

    if (action === "lockimage") {

      try {
        const info = await api.getThreadInfo(threadID);

        const oldLock =
          groupLocks.get(threadID) || {};

        groupLocks.set(threadID, {
          ...oldLock,

          threadName:
            oldLock.threadName ||
            info.threadName ||
            "",

          nicknames:
            oldLock.nicknames || {},

          image:
            info.imageSrc ||
            info.imageUrl ||
            info.threadImage ||
            oldLock.image ||
            null,

          lockImage: true
        });

        return message.reply(
          "🔒 Group image protection enabled."
        );

      } catch (err) {
        console.log(err);

        return message.reply(
          "❌ Could not lock group image."
        );
      }
    }

    // =====================================
    // UNLOCK GROUP IMAGE
    // =====================================

    if (action === "unlockimage") {

      const lock =
        groupLocks.get(threadID);

      if (!lock) {
        return message.reply(
          "ℹ️ No group protection is enabled."
        );
      }

      lock.lockImage = false;

      if (!lock.lockName && !lock.lockNicknames) {
        groupLocks.delete(threadID);
      }

      return message.reply(
        "🔓 Group image protection disabled."
      );
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
        "/nickset lockname\n" +
        "/nickset unlockname\n" +
        "/nickset lockimage\n" +
        "/nickset unlockimage\n" +
        "/nickset off\n\n" +
        "📨 Message system:\n" +
       "/msg Hello\n"  +
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
            null,

          lockName:
            oldLock?.lockName || false,

          lockImage:
            oldLock?.lockImage || false,

          lockNicknames: true
        });
      }

      const newNickname = args.join(" ");

      await message.reply(
        clear
          ? `🧹 Clearing nicknames of ${members.length} members...`
          : `🚀 Changing nicknames of ${members.length} members...`
      );

      for (let i = 0; i < members.length; i += 5) {

        if (running.get(threadID) === false) {
          running.delete(threadID);

          return message.reply(
            "🛑 Process stopped."
          );
        }

        const batch =
          members.slice(i, i + 5);

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

    const lock =
      groupLocks.get(threadID);

    try {

      // =================================
      // GROUP NAME
      // =================================

      if (
        event.logMessageType ===
        "log:thread-name"
      ) {

        if (!lock.lockName) {
          return;
        }

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

      // =================================
      // GROUP IMAGE
      // =================================

      if (
        event.logMessageType ===
        "log:thread-image"
      ) {

        if (!lock.lockImage) {
          return;
        }

        console.log(
          "[LOCK] Group image change detected."
        );

        if (!lock.image) {
          console.log(
            "[LOCK] Original group image unavailable."
          );

          return;
        }

        try {

          if (
            typeof api.changeGroupImage !==
            "function"
          ) {

            console.log(
              "[LOCK] changeGroupImage is not supported by this bot version."
            );

            return;
          }

          await api.changeGroupImage(
            lock.image,
            threadID
          );

          console.log(
            "[LOCK] Group image restored."
          );

        } catch (err) {

          console.log(
            "Image restore error:",
            err.message
          );
        }

        return;
      }

      // =================================
      // JOIN / LEAVE
      // =================================

      if (
        event.logMessageType ===
        "log:subscribe" ||
        event.logMessageType ===
        "log:unsubscribe"
      ) {
        return;
      }

      // =================================
      // NICKNAME PROTECTION
      // =================================

      if (!lock.lockNicknames) {
        return;
      }

      const info =
        await api.getThreadInfo(threadID);

      const savedNicknames =
        lock.nicknames || {};

      for (
        const uid of info.participantIDs
      ) {

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
