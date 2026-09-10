const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(process.cwd(), "globalNickLock.json");

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {
        enabled: false,
        name: "",
        groups: {}
      };
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return {
      enabled: false,
      name: "",
      groups: {}
    };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("خطأ في حفظ البيانات:", e);
  }
}

function changeName(api, threadID, name) {
  return new Promise((resolve) => {
    api.changeThreadName(name, threadID, (err) => {
      resolve(!err);
    });
  });
}

function getGroups(api) {
  return new Promise((resolve) => {
    api.getThreadList(
      1000,
      null,
      ["INBOX"],
      (err, list) => {
        if (err || !Array.isArray(list)) {
          return resolve([]);
        }

        const groups = list.filter(
          (thread) =>
            thread.isGroup === true ||
            (thread.threadID && thread.participantIDs && thread.participantIDs.length > 2)
        );

        resolve(groups);
      }
    );
  });
}

module.exports = {
  config: {
    name: "كنية",
    aliases: ["knia", "nickname"],
    version: "2.0.0",
    author: "shtot",
    countDown: 5,
    role: 2,
    category: "حماية",
    shortDescription: "تغيير وحماية اسم جميع الكروبات",
    longDescription:
      "تغيير اسم جميع الكروبات التي يدخل إليها البوت مع إمكانية قفل الاسم ومنع تغييره."
  },

  onStart: async function ({ api, event, args, message }) {
    const data = loadData();
    const sub = (args[0] || "").toLowerCase();

    // =========================
    // كنية
    // =========================
    if (sub === "كنية" || sub === "set" || sub === "name" || (!sub && args.length > 0)) {
      const newName = args.slice(1).join(" ").trim();

      if (!newName) {
        return message.reply(
          "❌ استعمل:\nكنية الاسم الجديد\n\nمثال:\nكنية KNNN BOT"
        );
      }

      data.name = newName;
      data.groups = {};

      const groups = await getGroups(api);

      if (!groups.length) {
        return message.reply("❌ ماقدرتش نلقى الكروبات.");
      }

      let success = 0;

      for (const thread of groups) {
        if (!thread.threadID) continue;

        const ok = await changeName(api, thread.threadID, newName);

        if (ok) {
          data.groups[thread.threadID] = newName;
          success++;
        }

        await new Promise((r) => setTimeout(r, 700));
      }

      saveData(data);

      return message.reply(
        `✅ تم تغيير الاسم.\n\n` +
        `📛 الاسم: ${newName}\n` +
        `👥 الكروبات: ${success}/${groups.length}\n\n` +
        `🔒 للحماية استعمل: غلق`
      );
    }

    // =========================
    // غلق
    // =========================
    if (sub === "غلق" || sub === "lock") {
      if (!data.name) {
        return message.reply(
          "❌ ماكاين حتى اسم محفوظ.\n\nأولاً استعمل:\nكنية الاسم الجديد"
        );
      }

      data.enabled = true;

      const groups = await getGroups(api);

      for (const thread of groups) {
        if (!thread.threadID) continue;

        data.groups[thread.threadID] = data.name;

        await changeName(api, thread.threadID, data.name);

        await new Promise((r) => setTimeout(r, 700));
      }

      saveData(data);

      return message.reply(
        `🔒 تم غلق أسماء الكروبات.\n\n` +
        `📛 الاسم المحمي: ${data.name}\n` +
        `👥 تم تفعيل الحماية على ${groups.length} كروب.`
      );
    }

    // =========================
    // فتح
    // =========================
    if (sub === "فتح" || sub === "unlock" || sub === "off") {
      data.enabled = false;
      saveData(data);

      return message.reply(
        "🔓 تم فتح أسماء الكروبات.\nالبوت لن يرجع الاسم القديم تلقائياً."
      );
    }

    // =========================
    // الحالة
    // =========================
    if (sub === "حالة" || sub === "status") {
      return message.reply(
        `📋 حالة حماية الأسماء\n\n` +
        `🔒 الحماية: ${data.enabled ? "مفعلة ✅" : "متوقفة ❌"}\n` +
        `📛 الاسم: ${data.name || "غير محدد"}\n` +
        `👥 المحفوظة: ${Object.keys(data.groups).length}`
      );
    }

    return message.reply(
      `📋 أوامر كنية\n\n` +
      `🔹 كنية الاسم\n` +
      `   تغيير اسم جميع الكروبات\n\n` +
      `🔒 غلق\n` +
      `   حماية الاسم\n\n` +
      `🔓 فتح\n` +
      `   إيقاف الحماية\n\n` +
      `📊 حالة\n` +
      `   معرفة حالة الحماية`
    );
  },

  // مراقبة تغييرات اسم الكروب
  onEvent: async function ({ api, event }) {
    const data = loadData();

    if (!data.enabled || !data.name) return;
    if (!event || !event.threadID) return;

    /*
      ws3-fca / FCA يرسل حدث تغيير اسم المجموعة
      عندما يتغير اسم المجموعة، نرجعه للاسم المحفوظ.
    */
    if (
      event.logMessageType === "log:thread-name" ||
      event.logMessageType === "log:thread-name-change"
    ) {
      const threadID = event.threadID;

      const wantedName = data.groups[threadID] || data.name;

      if (!wantedName) return;

      setTimeout(() => {
        api.changeThreadName(wantedName, threadID, (err) => {
          if (err) {
            console.log(
              `[كنية] فشل إرجاع اسم المجموعة ${threadID}:`,
              err.error || err
            );
          } else {
            console.log(
              `[كنية] تم إرجاع اسم المجموعة ${threadID} إلى: ${wantedName}`
            );
          }
        });
      }, 1000);
    }
  }
};
