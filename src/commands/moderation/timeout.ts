import { ChatInputCommandInteraction, Colors } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

import Logger from "@classes/Logger";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class TimeoutCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "Moderation",
                require: {
                    permissions: ["MODERATE_MEMBERS"],
                },
            },
            new SlashCommandBuilder()
                .setName("timeout")
                .setDescription("Time a member out.")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("set")
                        .setDescription("Set a member's timeout.")
                        .addUserOption(option => option.setName("user").setDescription("The user to timeout").setRequired(true))
                        .addStringOption(option => option.setName("time").setDescription("The amount of time to time out the user (30m, 2h30m, 5d)").setRequired(true))
                        .addStringOption(option => option.setName("reason").setDescription("The reason for the timeout").setRequired(false))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("remove")
                        .setDescription("Remove a member's timeout.")
                        .addUserOption(option => option.setName("user").setDescription("The user to remove the timeout from").setRequired(true))
                )
        );
    }

    private durationSeconds(timeExpr: string) {
        var units = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, M: 2592000, y: 31536000 };
        var regex = /(\d+)([smhdwMy])/g;

        let seconds = 0;
        var match;
        while ((match = regex.exec(timeExpr))) {
            seconds += parseInt(match[1]) * units[match[2]];
        }

        return seconds;
    }

    private async setTimeout(command: ChatInputCommandInteraction) {
        const user = command.options.getUser("user");
        const time = this.durationSeconds(command.options.getString("time")) * 1000;
        const reason = command.options.getString("reason") ?? "No reason provided by " + command.user.toString();
        const member = await command.guild.members.fetch(user);

        await member.timeout(time, reason);

        await command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    description: `${command.user.toString()}, ${member.toString()} has been timed out for \`${command.options.getString("time")}\` because of: \`${reason}\`.`,
                },
            ],
        });
    }

    private async removeTimeout(command: ChatInputCommandInteraction) {
        const user = command.options.getUser("user");
        const member = await command.guild.members.fetch(user);
        await member.timeout(null);
        await command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    description: `${command.user.toString()}, ${member.toString()} has had their timeout removed.`,
                },
            ],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        const subcommand = command.options.getSubcommand();
        switch (subcommand) {
            case "set":
                await this.setTimeout(command);
                break;
            case "remove":
                await this.removeTimeout(command);
                break;
        }
    }
}
