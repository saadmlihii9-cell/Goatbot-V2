module.exports = {
    name: "myinfo",
    version: "1.0.0",
    hasPermission: 0, // 0 = everyone can use
    credits: "YourName",
    description: "Send my profile info",
    usage: "+myinfo",
    cooldowns: 5,

    async execute({ api, event, args }) {
        const name = "saas  "; // 
        const facebookLink = "https://www.facebook.com/profile.php?id=61592891796221";

        const message = `
╭───[ MY INFO ]───╮
│ Name: ${saad}
│ Age: ${20}
│ Facebook: ${ https://www.facebook.com/profile.php?id=61592891796221}
╰──────────────────╯
`;
        
        api.sendMessage(message, event.threadID, event.messageID);
    }
  }
