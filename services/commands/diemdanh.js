const { scheduleAttendance } = require("../utils/schedule.js");
module.exports = {
    name: 'diemdanh',
    description: 'Điểm danh quân số 📃',
    async execute(message, args, config) {
        try {
            await scheduleAttendance(message.client, config);
        } catch (error) {
            console.error('Lỗi khi thực hiện điểm danh:', error);
            message.reply("Đã xảy ra lỗi khi điểm danh. Vui lòng thử lại sau.");
        }
    },
};