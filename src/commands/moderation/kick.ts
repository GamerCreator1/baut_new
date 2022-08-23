import { ChatInputCommandInteraction, TextBasedChannel, Colors, EmbedBuilder, PermissionsBitField } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

import Logger from "@classes/Logger";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class KickCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "Moderation",
                require: {
                    permissions: [PermissionsBitField.Flags.KickMembers],
                },
            },
            new SlashCommandBuilder()
                .setName("kick")
                .setDescription("Manage server kicks.")
                .addUserOption(option => option.setName("user").setDescription("The user to kick").setRequired(true))
                .addStringOption(option => option.setName("reason").setDescription("The reason for the kick").setRequired(false))
        );
    }

    async run(command: ChatInputCommandInteraction) {
        const user = command.options.getUser("user");
        const reason = command.options.getString("reason");
        const member = await command.guild.members.fetch(user);

        await member.kick(reason ?? `No reason provided by ${command.user.toString()}`);
        await command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    description: `${command.user.toString()}, ${member.toString()} has been kicked for: \`${reason ?? "N/A"}\`.`,
                },
            ],
        });
        const embed = new EmbedBuilder()
            .setAuthor({ name: "Members" })
            .setColor(Colors.DarkPurple)
            .setTitle("Member Kicked")
            .setFields([
                {
                    name: "Member",
                    value: member.user.toString(),
                    inline: true,
                },
            ])
            .setTimestamp(new Date());

        Logger.logEvent(this.client, command.guild, "Members", embed);
    }
}
