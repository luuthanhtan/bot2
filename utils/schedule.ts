import "../utils/logger.js";
import { Client, TextChannel } from "discord.js";
import { Config, config as importedConfig } from "../config.js";
import { Setting } from "../models/setting.js"

type MessageFunction = (options: Record<string, any>) => string;

interface Messages {
    [key: number]: MessageFunction;
}

const SEND_HOURS = [8, 9, 10, 12, 14, 16, 18];
const MESSAGES: Messages = {
    9: () => `<@everyone, Điểm danh nào! 📝 Bấm "co" nếu bạn có mặt!`,
    12: (options: Record<string, any>): string => `<@${options.sonId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
    14: (options: Record<string, any>): string => `<@${options.sonId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
    18: (): string => '⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜'
};

<<<<<<< HEAD:utils/schedule.js
let lastSentHour = null;

const sendChannelMessage = async (client, config, message) => {
=======
export const sendChannelMessage = async (client: Client, config: Config, message: string): Promise<void> => {
>>>>>>> new:utils/schedule.ts
    try {
        const settingM = new Setting();
        const channelId = config?.channeSpamSettingKey ? await settingM.getSetting(config.channeSpamSettingKey) : importedConfig.aiChannel;
        const channel = client.channels.cache.get(channelId || config.aiChannel) as TextChannel;

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

interface ScheduleTime {
    nextHour: number;
    timeUntil: number;
    nextDate: Date;
}

export const getNextScheduleTime = (): ScheduleTime => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const hours = nowVN.getHours();

    let nextHour = SEND_HOURS.find(h => h > hours);

    const nextDate = new Date(nowVN);

    if (!nextHour) {
        nextHour = SEND_HOURS[0];
        nextDate.setDate(nextDate.getDate() + 1);
    }

    nextDate.setHours(nextHour, 0, 0, 0);

    let timeUntil = nextDate.getTime() - nowVN.getTime();

    if (timeUntil < 60000) {
        timeUntil = 60000;
    }

    console.log(`🕒 Thời gian hiện tại: ${nowVN}`);

    return { nextHour, timeUntil, nextDate };
};

export const scheduleAttendance = async (client: Client, config: Config) => {
    const settingM = new Setting();
    const channelId = await settingM.getSetting(config.channeSpamSettingKey || 'channel_spam_bot') || config.aiChannel;
    const channel = client.channels.cache.get(channelId || config.aiChannel) as TextChannel;

    const { nextDate } = getNextScheduleTime();

    // Format ngày tháng
    const day = String(nextDate.getDate()).padStart(2, '0');
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const year = nextDate.getFullYear();
    const formattedDate = `Ngày ${day}/${month}/${year}`;

    if (!channel) {
        console.log("Không tìm thấy kênh. 🚫🚫🚫");
        return;
    }

    const message = await channel.send(`${formattedDate}\n@everyone Điểm danh nào! 📝`);

    const filter = (response: { content: string }) => response.content.toLowerCase() === 'co';
    const collector = channel.createMessageCollector({ filter, time: 2 * 60 * 1000 });

    const membersWhoReplied = new Set();

    collector.on('collect', (message) => {
        console.log(`${message.author.tag} đã điểm danh!`);
        membersWhoReplied.add(message.author.id);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            const members = await message.guild.members.fetch();
            const membersNotReplied = members.filter(member => 
                !membersWhoReplied.has(member.id) && !member.user.bot
            );

            if (membersNotReplied.size > 0) {
                const missingMembers = membersNotReplied.map(member => member.user.tag).join(', ');
                console.log('Missing members:', missingMembers);
                channel.send(`⏰ Đã hết thời gian điểm danh!`);
                channel.send(`⚠️ Danh sách những người vắng mặt sẽ bị chích điện ⚡: ${missingMembers} \n \n Nhớ Stand Up Daily nhé 📃`);
            } else {
                channel.send('🎉 Tất cả mọi người đã điểm danh!');
            }
        } else {
            channel.send('🎉 Cảm ơn các bạn đã điểm danh!');
        }
    });
};

export const scheduleNextMessage = async (client: Client, config: Config): Promise<void> => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const dayOfWeek = nowVN.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log('😴 Hôm nay là Thứ Bảy hoặc Chủ Nhật, không lên lịch gửi tin nhắn.');
        return;
    }
    const settingM = new Setting();
    const sonId = await settingM.getSetting(config.electricTargetKey || 'electric_target_id');
    const { nextHour, timeUntil } = getNextScheduleTime();

    console.log("⚡ gần nhất:", lastSentHour, "h:00");
    if (nextHour === lastSentHour) {
        console.log(`🚫 Đã gửi tin nhắn lúc ${nextHour}:00 rồi`);
        return;
    }

    console.log(`⚡ tiếp theo vào ${nextHour}:00 (${Math.round(timeUntil / 60000)} phút nữa 🤗)`);
<<<<<<< HEAD:utils/schedule.js

    setTimeout(() => {
        console.log(`📢 Đang gửi tin nhắn cho ${nextHour}:00`);
        
=======
    setTimeout(async () => {
        console.log(`📢 Đang gửi tin nhắn cho ${nextHour}:00`);
>>>>>>> new:utils/schedule.ts
        if (nextHour === 9) {
            scheduleAttendance(client, config);
        } else if (SEND_HOURS.includes(nextHour)) {
            const options: Record<string, any> = { 
                sonId: sonId,
            };
            const message = MESSAGES[nextHour]?.(options) || 
            `<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây, <${config.camGif}> "rẹt rẹt rẹt ...⚡⚡⚡"`;
            sendChannelMessage(client, config, message);
        }

        lastSentHour = nextHour;

<<<<<<< HEAD:utils/schedule.js
        console.log(`⏳ Đang lên lịch cho lần gửi tiếp theo...`);
        scheduleNextMessage(client, config);
=======
        await scheduleNextMessage(client, importedConfig);
>>>>>>> new:utils/schedule.ts
    }, timeUntil);
};