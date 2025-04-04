// commands/continuechat.ts
import { GuildMember } from 'discord.js';
import { ChatMessage, ExecuteParams, Command } from './types.js';
import '../../utils/logger.js';

const command: Command = {
    name: 'continuechat',
    description: 'Tiếp tục một cuộc trò chuyện AI đã lưu, cú pháp: `!continuechat <chatId>`',  
    async execute({ message, args, chatM }: ExecuteParams): Promise<void> {
        let userId: string = message.author.id;
        let chatId: string;
        
        if (!args[0]) {
            message.reply('Vui lòng cung cấp ID cuộc trò chuyện (ví dụ: a1, a2, ...). Sử dụng lệnh `!chats` để xem danh sách cuộc trò chuyện của bạn.');
            return;
        }
        chatId = args[0];
        
        const member: GuildMember | undefined = message.mentions.members?.first();
        if (member) {
            userId = member.id;
            if (!args[1]) {
                message.reply('Vui lòng cung cấp ID cuộc trò chuyện (ví dụ: a1, a2, ...). Sử dụng lệnh `!chats hoặc !chats @orderUser` để xem danh sách cuộc trò chuyện của bạn. Nếu sử dụng @orderUser, hãy cung cấp ID cuộc trò chuyện của họ.');
                return;
            }
            chatId = args[1];
        }
    
        try {
            const chats = await chatM.getUserChats(userId);
            const targetChat = chats.find(chat => chat.chat_id === chatId);
            
            if (!targetChat) {
                message.reply(`Không tìm thấy cuộc trò chuyện với ID "${chatId}". Vui lòng kiểm tra lại hoặc sử dụng lệnh \`!chats\` để xem danh sách cuộc trò chuyện của bạn.`);
                return;
            }
            
            await chatM.save({id: targetChat.id, updated_at: new Date()});
            
            const recentMessages: ChatMessage[] = await chatM.getChatMessages(targetChat.id, 5);
            let messagePreview: string = "";
            
            if (recentMessages && recentMessages.length > 0) {
                messagePreview = recentMessages.map(msg => 
                    `${msg.role === 'user' ? '👤 Bạn' : '🤖 AI'}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
                ).join('\n');
            } else {
                messagePreview = "(Chưa có tin nhắn)";
            }
            
            await message.reply(`Đã chuyển đến cuộc trò chuyện: **${targetChat.title || chatId}**\n\nCác tin nhắn gần đây:\n${messagePreview}\n\nBạn có thể tiếp tục trò chuyện với lệnh \`!ai\`.`);
            
            console.log(`User ${message.author.tag} (${userId}) đã tiếp tục cuộc trò chuyện ${chatId}`);
            return;
            
        } catch (error: any) {
            console.error(`Lỗi khi tiếp tục cuộc trò chuyện: ${error.message}`);
            message.reply('Có lỗi xảy ra khi chuyển cuộc trò chuyện. Vui lòng thử lại sau.');
            return;
        }
    },
};

export default command;
