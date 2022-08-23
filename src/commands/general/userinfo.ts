import { ChatInputCommandInteraction, EmbedBuilder, Colors, ColorResolvable } from "discord.js";

import Logger from "@classes/Logger";
import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class UserInfoCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "General",
            },
            new SlashCommandBuilder()
                .setName("user")
                .setDescription("Returns some information about the user")
                .addUserOption(option => option.setName("user").setDescription("The user to get information about.").setRequired(false))
        );
    }

    async run(command: ChatInputCommandInteraction) {
        const user = await (command.options.getUser("user") ?? command.user).fetch(true);
        const member = await command.guild.members.fetch(user.id);
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
                    value: user.id,
                    inline: true,
                },
                {
                    name: "Created At",
                    value: `<t:${user.createdAt.valueOf().toString().substring(0, 10)}>`,
                    inline: true,
                },
                {
                    name: "Joined At",
                    value: `<t:${member.joinedAt?.valueOf().toString().substring(0, 10)}>`,
                    inline: true,
                },
                {
                    name: "Type",
                    value: user.bot ? "🤖" : "🧑",
                    inline: true,
                },
                {
                    name: "Roles",
                    value: member.roles.cache.size.toString(),
                    inline: true,
                },
            ])
            .setThumbnail(member.displayAvatarURL());
        if (user.banner) embed.setImage(user.bannerURL());
        await command.editReply({
            embeds: [embed],
        });
    }
}
