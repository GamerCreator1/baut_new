import ContextMenu from "@structures/ContextMenu";
import DiscordClient from "@structures/DiscordClient";
import { ContextMenuCommandInteraction } from "discord.js";

export default class BookmarkMenu extends ContextMenu {
    constructor() {
        super("Bookmark", "MESSAGE");
    }

    async onInteraction(interaction: ContextMenuCommandInteraction, client: DiscordClient) {
        const messageId = interaction.targetId;
        const message = await interaction.channel.messages.fetch(messageId);
        const created = await client.db.bookmark.findFirst(
            {
                where:
                {
                    channelId: message.channel.id,
                    messageID: messageId
                }
            }
        )
        if (created) {
            await interaction.editReply({ content: "This message is already bookmarked. Check out the `/bookmark` command for some help." })
            return;
        }
        const numCreated = await client.db.bookmark.count({
            where: {
                userId: interaction.user.id
            }
        })
        if (numCreated >= 25) {
            await interaction.editReply({ content: "You have reached the maximum number of bookmarks. Try removing some bookmarks before adding more. Check out the `/bookmark` command for some help." })
            return;
        }
        const { id } = await client.db.bookmark.create({
            data: {
                channelId: message.channel.id,
                messageID: messageId,
                userId: interaction.user.id
            }
        })
        await interaction.editReply({ content: `Message bookmarked! [ID: ${id}]` })
    }
}