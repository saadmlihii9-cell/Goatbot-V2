module.exports = {
  config: {
    name: "info",
    version: "1.0.0",
    author: "shtot",
    countDown: 3,
    role: 0,
    shortDescription: "Show my information",
    category: "info",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    const info = `👤 Name: shtot
🎂 Age: 20
🔗 Facebook: https://www.facebook.com/profile.php?id=61592891796221`;

    return message.reply(info);
  }
};
