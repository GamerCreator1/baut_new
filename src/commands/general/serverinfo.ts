import { ChatInputCommandInteraction, EmbedBuilder, Colors, ChannelType, ColorResolvable } from "discord.js";

import Logger from "@classes/Logger";
import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class ServerInfoCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "General",
            },
            new SlashCommandBuilder().setName("serverinfo").setDescription("Returns some information about the current server.")
        );
    }

    async run(command: ChatInputCommandInteraction) {
        const owner = await command.guild.fetchOwner();
        const embed = new EmbedBuilder()
            .setColor(process.env.BUILDERGROOP_COLOR as ColorResolvable)
            .setTitle("Server Information")
            .setFields([
                {
                    name: "Name",
                    value: command.guild.name,
                    inline: true,
                },
                {
                    name: "ID",
                    value: command.guild.id,
                    inline: true,
                },
                {
                    name: "Owner",
                    value: owner.toString() ?? "N/A",
                    inline: true,
                },
                {
                    name: "Members",
                    value: command.guild.memberCount.toString(),
                    inline: true,
                },
                {
                    name: "Channels",
                    value: ` ${command.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size} 📁 / ${
                        command.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size
                    } 💬 / ${command.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size} 🔉`,
                    inline: true,
                },
                {
                    name: "Boost Status",
                    value: command.guild.premiumSubscriptionCount ? `${command.guild.premiumSubscriptionCount} boosts` : "None",
                    inline: true,
                },
                {
                    name: "Roles",
                    value: command.guild.roles.cache.size.toString(),
                    inline: true,
                },
                {
                    name: "Emojis",
                    value: command.guild.emojis.cache.size.toString(),
                    inline: true,
                },
                {
                    name: "Created At",
                    value: `<t:${command.guild.createdAt.getTime().toString().substring(0, 10)}:f>`,
                    inline: true,
                },
            ])
            .setThumbnail(command.guild.iconURL() ?? "https://cdn.discordapp.com/embed/avatars/0.png");
        // add banner if server has one
        if (command.guild.bannerURL()) embed.setImage(command.guild.bannerURL());
        await command.editReply({ embeds: [embed] });
    }
}
