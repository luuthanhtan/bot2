require('../utils/logger');
let db, getChannelId, saveChannelId;
if (process.env.APP_ENV === 'local') {
  ({ db, getChannelId, saveChannelId } = require("./sddatabase3"));
} else {
  ({ db, getChannelId, saveChannelId } = require("./database"));
}

// Danh sách giờ gửi tin nhắn
const SEND_HOURS = [8, 10, 12, 14, 16, 18];

const MESSAGES = {
    9: (config) => `<@${config.sonId}>, chào buổi sáng! 🌅 Đã đến lúc khởi động ngày mới với một cú chích điện nhẹ nhàng! ⚡⚡`,
    12: (config) => `<@${config.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (config) => `<@${config.sonId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: () => '⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜'
};

const sendChannelMessage = async (client, config, message) => {
    try {
        const channelId = await getChannelId();
        const channel = client.channels.cache.get(channelId || config.aiChannel);
        console.log("Kênh:", channelId);
        if (!channel) {
            console.log("Không tìm thấy kênh. 🚫🚫🚫");
            return;
        }

        channel.send(message);
        console.log(`✅ Tin nhắn đã được gửi thành công!`);
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
    }
};

const getNextScheduleTime = () => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const hours = nowVN.getHours();

    let nextHour = SEND_HOURS.find(h => h > hours);

    const nextDate = new Date(nowVN);

    if (!nextHour) {
        nextHour = SEND_HOURS[0]; // Chuyển sang ngày mai nếu đã hết giờ
        nextDate.setDate(nextDate.getDate() + 1);
    }

    nextDate.setHours(nextHour, 0, 0, 0);

    let timeUntil = nextDate - nowVN;

    if (timeUntil < 60000) {
        timeUntil = 60000; // Đặt tối thiểu là 1 phút
    }

    console.log(`🕒 Thời gian hiện tại: ${nowVN}`);

    return { nextHour, timeUntil };
};

const scheduleNextMessage = (client, config) => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const dayOfWeek = nowVN.getDay(); // 0 là Chủ Nhật, 6 là Thứ Bảy

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log('😴 Hôm nay là Thứ Bảy hoặc Chủ Nhật, không lên lịch gửi tin nhắn.');
        return;
    }

    const { nextHour, timeUntil } = getNextScheduleTime();
    console.log(`⚡ tiếp theo vào ${nextHour}:00 (${Math.round(timeUntil / 60000)} phút nữa 🤗)`);
    setTimeout(() => {
        console.log(`📢 Đang gửi tin nhắn cho ${nextHour}:00`);
        const specialMessage = MESSAGES[nextHour]?.(config);
        if (specialMessage) {
            sendChannelMessage(client, config, specialMessage);
        } else if (SEND_HOURS.includes(nextHour)) {
            sendChannelMessage(client, config,
                `<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ...⚡⚡⚡"`);
        }

        console.log(`⏳ Đang lên lịch cho lần gửi tiếp theo...`);

        scheduleNextMessage(client, config);
    }, timeUntil);
};

module.exports = { scheduleNextMessage };