import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { Bookmarks } from '../models/bookmark.js';
const PAGE_SIZE = 4;
export async function fetchBookmarks(userId, page = 1, tag) {
    const skip = (page - 1) * PAGE_SIZE;
    const bookmarkM = new Bookmarks();
    let isAll = false;
    if (tag?.length === 1 && tag[0] === '__ALL__' || !tag) {
        isAll = true;
    }
    const whereCondition = {
        // savedByUserId: userId,
        ...(!isAll ? { tags: { hasSome: tag } } : {}),
    };
    const bookmarks = await bookmarkM.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        skip,
    });
    return bookmarks;
}
export function buildBookmarkEmbeds(bookmarks) {
    return bookmarks.map((bookmark) => {
        const embed = new EmbedBuilder()
            .setTitle(bookmark.title || '🔖 Bookmark')
            .setDescription(`[Nhấn để mở link](${bookmark.url})`)
            .addFields({ name: 'Tag', value: bookmark.tags.join(', ') || 'Không có', inline: true }, { name: 'Thêm lúc', value: `<t:${Math.floor(new Date(bookmark.createdAt).getTime() / 1000)}:f>`, inline: true })
            .setColor(0x00bfff);
        const deleteButton = new ButtonBuilder()
            .setCustomId(`bookmark:delete:${bookmark.id}`)
            .setLabel('🗑️ Xoá')
            .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(deleteButton);
        return { embeds: [embed], components: [row] };
    });
}
export function buildPaginationButtons(page, tag) {
    const tagValue = Array.isArray(tag) ? tag.join(',') : (tag ?? '');
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`bookmark:prev:${page}:${tagValue}`)
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId(`bookmark:next:${page}:${tagValue}`)
        .setLabel('▶')
        .setStyle(ButtonStyle.Secondary));
}
export function buildEmbedForBookmark(bookmark) {
    const embed = new EmbedBuilder()
        .setTitle('📌 Bookmark')
        .setDescription(bookmark.content)
        .setFooter({ text: `🕒 ${bookmark.createdAt.toLocaleString()}` })
        .setColor(0x00bfff);
    return embed;
}
export function buildDeleteButtonRow(bookmarkId, page) {
    if (!page) {
        page = 1;
    }
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`bookmark:delete:${bookmarkId}:${page}`)
        .setLabel('🗑️ Xoá')
        .setStyle(ButtonStyle.Danger));
}
// Sửa hàm buildBookmarkEmbedsAndRows
export function buildCombinedBookmarkEmbed(bookmarks) {
    const embeds = [];
    bookmarks.forEach((bookmark, index) => {
        const embed = new EmbedBuilder()
            .setTitle(`📌 Bookmark #${index + 1}`)
            .setColor(0x00bfff)
            .setDescription(bookmark.content || 'Không có nội dung')
            .setURL(bookmark.messageLink)
            .addFields({
            name: 'ℹ️ Thông tin',
            value: `🏷️ Tags: ${bookmark.tags.join(', ') || 'Không có'}\n🕒 Lúc: <t:${Math.floor(new Date(bookmark.createdAt).getTime() / 1000)}:f>\n🆔 ID: ${bookmark.id}`
        });
        if (bookmark.attachments && bookmark.attachments.length > 0) {
            embed.setImage(bookmark.attachments[0]);
        }
        embeds.push(embed);
    });
    const buttons = bookmarks.map((bookmark, index) => {
        return new ButtonBuilder()
            .setCustomId(`bookmark:delete:${bookmark.id}`)
            .setLabel(`🗑️ Xóa bookmark #${index + 1}`)
            .setStyle(ButtonStyle.Danger);
    });
    const actionRows = [];
    for (let i = 0; i < buttons.length; i += 5) {
        const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 5));
        actionRows.push(row);
    }
    return {
        embed: embeds,
        actionRows
    };
}
