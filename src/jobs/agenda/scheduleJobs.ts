import { Client } from "discord.js";
import { Setting } from "../../../models/setting.js";
import { Config } from "../../../config.js";
import { scheduleAttendance, sendChannelMessage } from "../../../utils/schedule.js";

// 🕓 Các khung giờ cần gửi message
const SEND_HOURS = [8, 9, 10, 12, 14, 16, 18];

// 📩 Các nội dung gửi theo từng giờ
const MESSAGES: { [key: number]: (options: Record<string, any>) => string } = {
  9: () => `<@everyone>, Điểm danh nào! 📝 Bấm "co" nếu bạn có mặt!`,
  12: ({ targetId }) =>
    `<@${targetId}>, đã 12h trưa rồi, nghỉ tay đi ăn cơm 🍚🥢 rồi chích điện tiếp thôi! ⚡⚡`,
  14: ({ targetId }) => `<@${targetId}>, 2h chiều rồi, có đặt nước không? 🧃🚰`,
  18: () => "⏱️ Bây giờ là 6h chiều, coookkkkkkkkkk 🏡🏡🏡 🍳🍲🍜",
};

export const defineMessageJob = (
  agenda: any,
  client: Client,
  config: Config
) => {
  agenda.define("send scheduled message", async () => {
    const settingM = new Setting();
    const targetId =
      (await settingM.getSetting(config.electricTargetKey)) || "defaultTarget";

    const nowVN = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
      })
    );
    const hour = nowVN.getHours();
    const weekday = nowVN.getDay(); // 0 = CN, 6 = T7

    if (weekday === 0 || weekday === 6) {
      console.log("😴 Hôm nay là cuối tuần, không gửi gì cả.");
      return;
    }

    if (hour === 9) {
      await scheduleAttendance(client, config);
    } else if (SEND_HOURS.includes(hour)) {
      const message =
        MESSAGES[hour]?.({ targetId }) ||
        `<@${targetId}>, tới giờ chích điện định kỳ ⚡⚡⚡`;
      await sendChannelMessage(client, config, message);
    } else {
      console.log(`📭 Không có nội dung nào cho giờ ${hour}`);
    }
  });
};
