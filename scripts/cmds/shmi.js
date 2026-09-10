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
    console.error("[lock] خطأ في حفظ البيانات:", e);
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
          console.error("[lock] فشل جلب المجموعات:", err);
          return resolve([]);
        }

        const groups = list.filter((thread) => {
          return (
            thread &&
            thread.threadID &&
            (
              thread.isGroup === true ||
              (
                Array.isArray(thread.participantIDs) &&
                thread.participantIDs.length > 2
              )
            )
          );
        });

        resolve(groups);
      }
    );
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  config: {
    name: "تغير",
    aliases: ["change", "taghyir"],
    version: "3.0.0",
    author: "shtot",
    countDown: 5,
    role: 2,
    category: "حماية",
    shortDescription: "تغيير وحماية أسماء المجموعات",
    longDescription:
      "تغيير اسم جميع المجموعات التي يستطيع البوت الوصول إليها وحمايتها من التغيير."
  },

  onStart: async function ({ api, event, args, message }) {
    const data = loadData();
    const sub = (args[0] || "").toLowerCase();

    // =========================
    // تغير
    // =========================
    if (
      sub === "تغير" ||
      sub === "change" ||
      sub === "taghyir" ||
      args.length > 0
    ) {
      const newName = args.join(" ").trim();

      if (!newName) {
        return message.reply(
          "❌ خاصك تكتب الاسم الجديد.\n\n" +
          "مثال:\n" +
          "تغير KNNN BOT"
        );
      }

      data.name = newName;
      data.groups = {};

      const groups = await getGroups(api);

      if (!groups.length) {
        return message.reply(
          "❌ ماقدرتش نلقى المجموعات.\n" +
          "تأكد أن البوت داخل للمجموعات."
        );
      }

      let success = 0;
      let failed = 0;

      for (const thread of groups) {
        const threadID = thread.threadID;

        if (!threadID) continue;

        const ok = await changeName(api, threadID, newName);

        if (ok) {
          data.groups[threadID] = newName;
          success++;
        } else {
          failed++;
        }

        // تأخير بسيط بين كل مجموعة
        await sleep(700);
      }

      saveData(data);

      return message.reply(
        "✅ تم تغيير أسماء المجموعات\n\n" +
        `📛 الاسم الجديد: ${newName}\n` +
        `✅ نجح: ${success}\n` +
        `❌ فشل: ${failed}\n` +
        `👥 المجموع: ${groups.length}\n\n` +
        "🔒 إذا بغيتي تحمي الاسم استعمل:\n" +
        "lock"
      );
    }

    // =========================
    // lock
    // =========================
    if (sub === "lock") {
      if (!data.name) {
        return message.reply(
          "❌ ماكاين حتى اسم محفوظ.\n\n" +
          "أولاً استعمل:\n" +
          "تغير الاسم"
        );
      }

      data.enabled = true;

      const groups = await getGroups(api);

      let success = 0;

      for (const thread of groups) {
        if (!thread.threadID) continue;

        data.groups[thread.threadID] = data.name;

        const ok = await changeName(
          api,
          thread.threadID,
          data.name
        );

        if (ok) success++;

        await sleep(700);
      }

      saveData(data);

      return message.reply(
        "🔒 تم تفعيل حماية أسماء المجموعات\n\n" +
        `📛 الاسم المحمي: ${data.name}\n` +
        `👥 المجموعات: ${success}/${groups.length}\n\n` +
        "أي تغيير لاسم المجموعة سيحاول البوت إرجاعه."
      );
    }

    // =========================
    // فتح
    // =========================
    if (
      sub === "فتح" ||
      sub === "unlock" ||
      sub === "off"
    ) {
      data.enabled = false;
      saveData(data);

      return message.reply(
        "🔓 تم إيقاف حماية أسماء المجموعات."
      );
    }

    // =========================
    // حالة
    // =========================
    if (
      sub === "حالة" ||
      sub === "status"
    ) {
      return message.reply(
        "📋 حالة حماية أسماء المجموعات\n\n" +
        `🔒 الحماية: ${
          data.enabled ? "مفعلة ✅" : "متوقفة ❌"
        }\n` +
        `📛 الاسم: ${
          data.name || "غير محدد"
        }\n` +
        `👥 المجموعات المحفوظة: ${
          Object.keys(data.groups).length
        }`
      );
    }

    // =========================
    // المساعدة
    // =========================
    return message.reply(
      "📋 أوامر تغير\n\n" +
      "🔹 تغير الاسم\n" +
      "تغيير اسم جميع المجموعات\n\n" +
      "🔒 lock\n" +
      "حماية أسماء المجموعات\n\n" +
      "🔓 فتح\n" +
      "إيقاف الحماية\n\n" +
      "📊 حالة\n" +
      "معرفة حالة الحماية"
    );
  },

  // =========================
  // مراقبة تغيير اسم المجموعة
  // =========================
  onEvent: async function ({ api, event }) {
    const data = loadData();

    if (!data.enabled || !data.name) return;
    if (!event || !event.threadID) return;

    if (
      event.logMessageType === "log:thread-name" ||
      event.logMessageType === "log:thread-name-change"
    ) {
      const threadID = event.threadID;

      const wantedName =
        data.groups[threadID] || data.name;

      if (!wantedName) return;

      setTimeout(() => {
        api.changeThreadName(
          wantedName,
          threadID,
          (err) => {
            if (err) {
              console.log(
                `[lock] فشل إرجاع اسم المجموعة ${threadID}`
              );
            } else {
              console.log(
                `[lock] تم إرجاع اسم المجموعة ${threadID} إلى: ${wantedName}`
              );
            }
          }
        );
      }, 1000);
    }
  }
};
