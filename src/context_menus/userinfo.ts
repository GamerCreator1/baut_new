import ContextMenu from "@structures/ContextMenu";
import DiscordClient from "@structures/DiscordClient";
import { ColorResolvable, EmbedBuilder, UserContextMenuCommandInteraction } from "discord.js";

export default class UserMenu extends ContextMenu {
    constructor() {
        super("User Info", "USER");
    }

    async onInteraction(interaction: UserContextMenuCommandInteraction, client: DiscordClient) {
        const member = await interaction.guild.members.fetch(interaction.targetMember.user.id);
        const embed = new EmbedBuilder()
            .setColor(member.displayColor as ColorResolvable)
            .setTitle("User Information")
            .setFields([
                {
                    name: "Username",
                    value: member.displayName,
                    inline: true,
                },
                {
                    name: "ID",
                    value: member.id,
                    inline: true,
                },
                {
                    name: "Created At",
                    value: `<t:${member.user.createdAt.valueOf().toString().substring(0, 10)}>`,
                    inline: true,
                },
                {
                    name: "Joined At",
                    value: `<t:${member.joinedAt?.valueOf().toString().substring(0, 10)}>`,
                    inline: true,
                },
                {
                    name: "Type",
                    value: member.user.bot ? "🤖" : "🧑",
                    inline: true,
                },
                {
                    name: "Roles",
                    value: member.roles.cache.size.toString(),
                    inline: true,
                },
            ])
            .setThumbnail(member.displayAvatarURL());
        if (member.user.banner) embed.setImage(member.user.bannerURL());

        await interaction.editReply({
            embeds: [embed],
        });
    }
}
