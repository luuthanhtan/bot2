// commands/unmute.js
import '../../utils/logger.js';
import { Message, GuildMember, Role } from 'discord.js';
import { Config } from '../../config';
interface Command {
    name: string;
    description: string;
    execute: (message: Message, args: string[], config: Config, logModAction: Function) => Promise<void>;
}

export default {
    name: 'unmute',
    description: 'Unmute a user in the server.',
    async execute(message: Message, args: string[], config: Config, logModAction: Function): Promise<void> {
        if (!message.member?.permissions.has('ModerateMembers')) {
            await message.reply('Bạn không có quyền sử dụng lệnh này.');
            return;
        }

        const member: GuildMember | undefined = message.mentions.members?.first();
        if (!member) {
            await message.reply('Bạn cần tag người dùng cần unmute.');
            return;
        }

        const mutedRole: Role | undefined = message.guild?.roles.cache.find(role => role.name === config.mutedRole);
        if (!mutedRole) {
            await message.reply('Không tìm thấy role Muted.');
            return;
        }

        if (!member.roles.cache.has(mutedRole.id)) {
            await message.reply('Người dùng này không bị mute.');
            return;
        }

        try {
            await member.roles.remove(mutedRole);
            if ('send' in message.channel) {
                message.channel.send(`:speaker: Đã unmute **${member.user.tag}**.`);
            }
            logModAction(message.guild, 'Unmute', message.author, member.user, 'Đã được gỡ mute bởi người quản lý', config);
        } catch (error) {
            console.error(error);
            await message.reply('Có lỗi xảy ra khi unmute người dùng.');
        }
    },
} as Command;
