// commands/run.js
module.exports = {
    name: 'run',
    description: 'Chạy ngay điiiiiiiiiiiii! 🏃‍➡️',
    async execute(message, args, config) {
        const member = message.mentions.members.first();
        if (message.author.id === member.id) {
            return message.reply(`Chạy đi ${member},  chạy điiiiii  🏃‍➡️🏃‍➡️🏃‍➡️`);
        }
        return message.reply(`${member} CHẠY NGAY THÔIIIIIIIII 🏃‍➡️🏃‍➡️🏃‍➡️`);
    },
};