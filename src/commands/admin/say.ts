import { ChatInputCommandInteraction, Colors, PermissionsBitField } from "discord.js";

import Logger from "@classes/Logger";
import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class SayCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "Admin",
                require: {
                    permissions: [PermissionsBitField.Flags.ManageGuild],
                },
                ephemeral: true,
            },
            new SlashCommandBuilder()
                .setName("say")
                .setDescription("Says whatever you want me to say.")
                .addStringOption(option => option.setName("message").setDescription("The message you want me to say.").setRequired(true))
        );
    }

    async run(command: ChatInputCommandInteraction) {
        const message = command.options.getString("message");

        await command.deleteReply();
        await command.channel.send({
            content: message,
            options: {
                username: command.user.username,
            },
        });
    }
}
