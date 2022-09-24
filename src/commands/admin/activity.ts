import { ChatInputCommandInteraction, Colors, PermissionsBitField, Role } from "discord.js";

import Logger from "@classes/Logger";
import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class ActivityCommand extends Command {
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
                .setName("activity")
                .setDescription("Manage activity settings")
                .addSubcommand(subcommand => subcommand
                    .setName("threshold")
                    .setDescription("Set or view the number of messages required to be considered active")
                    .addNumberOption(option => option
                        .setName("number")
                        .setDescription("The number of messages")))
                .addSubcommand(subcommand => subcommand
                    .setName("role")
                    .setDescription("Set or view the role to be given for activity")
                    .addRoleOption(option => option
                        .setName("role")
                        .setDescription("The role to give")))
        );
    }

    private async setThreshold(command: ChatInputCommandInteraction) {
        const number = command.options.getNumber("number");
        if (number < 1) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Number must be greater than 0",
                    },
                ],
            });
        }
        await this.client.db.settings.upsert({
            where: {
                name: "activity_threshold"
            },
            create: {
                name: "activity_threshold",
                value: number.toString(),
            },
            update: {
                value: number.toString(),
            }
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Activity threshold set to ${number}`,
                },
            ],
        });
    }

    private async setRole(command: ChatInputCommandInteraction) {
        const role = command.options.getRole("role") as Role;
        if (role.comparePositionTo(command.guild.members.me.roles.highest) >= 0) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Role is higher than my highest role",
                    },
                ],
            });
        }
        console.log(role.comparePositionTo(command.guild.members.me.roles.highest))
        await this.client.db.settings.upsert({
            where: {
                name: "activity_role"
            },
            create: {
                name: "activity_role",
                value: role.id
            },
            update: {
                value: role.id
            }
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Activity role set to ${role.toString()}`,
                },
            ],
        });
    }

    private async getThreshold(command: ChatInputCommandInteraction) {
        const threshold = await this.client.db.settings.findUnique({
            where: {
                name: "activity_threshold"
            }
        });
        if (!threshold) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Activity role not set",
                    },
                ],
            });
        }
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Activity threshold is ${threshold.value}`,
                },
            ],
        });
    }

    private async getRole(command: ChatInputCommandInteraction) {
        const role = await this.client.db.settings.findUnique({
            where: {
                name: "activity_role"
            }
        });
        if (!role) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Activity role not set",
                    },
                ],
            });
        }
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Activity role is <@&${role.value}>`,
                },
            ],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        const subcommand = command.options.getSubcommand();
        switch (subcommand) {
            case "threshold":
                if (command.options.getNumber("number")) {
                    await this.setThreshold(command);
                }
                else {
                    await this.getThreshold(command);
                }
                break;
            case "role":
                if (command.options.getRole("role")) {
                    await this.setRole(command)
                }
                else {
                    await this.getRole(command);
                }
                break;
        }
    }
}
