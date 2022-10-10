import { ChatInputCommandInteraction, Colors, GuildChannel, PermissionsBitField, Role } from "discord.js";

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
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("threshold")
                        .setDescription("Set or view the number of messages required to be considered active")
                        .addNumberOption(option => option.setName("number").setDescription("The number of messages"))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("role")
                        .setDescription("Set or view the role to be given for activity")
                        .addRoleOption(option => option.setName("role").setDescription("The role to give"))
                )
                .addSubcommandGroup(group =>
                    group
                        .setName("channels")
                        .setDescription("Manage activity status for channels")
                        .addSubcommand(subcommand =>
                            subcommand
                                .setName("ignore")
                                .setDescription("Toggle a channel's activity status")
                                .addChannelOption(option => option.setName("channel").setDescription("The channel to toggle"))
                        )
                        .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all channels that are ignored"))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("timeout")
                        .setDescription("Set or view how much time between messages is required to be considered active")
                        .addNumberOption(option => option.setName("number").setDescription("The number of minutes"))
                )
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
                name: "activity_threshold",
            },
            create: {
                name: "activity_threshold",
                value: number.toString(),
            },
            update: {
                value: number.toString(),
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Activity threshold set to \`${number}\``,
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
        console.log(role.comparePositionTo(command.guild.members.me.roles.highest));
        await this.client.db.settings.upsert({
            where: {
                name: "activity_role",
            },
            create: {
                name: "activity_role",
                value: role.id,
            },
            update: {
                value: role.id,
            },
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
                name: "activity_threshold",
            },
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
                    description: `Activity threshold is \`${threshold.value}\``,
                },
            ],
        });
    }

    private async getRole(command: ChatInputCommandInteraction) {
        const role = await this.client.db.settings.findUnique({
            where: {
                name: "activity_role",
            },
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

    private async setTimeout(command: ChatInputCommandInteraction) {
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
                name: "activity_timeout",
            },
            create: {
                name: "activity_timeout",
                value: number.toString(),
            },
            update: {
                value: number.toString(),
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Activity timeout set to \`${number}\``,
                },
            ],
        });
    }

    private async getTimeout(command: ChatInputCommandInteraction) {
        const timeout = await this.client.db.settings.findUnique({
            where: {
                name: "activity_timeout",
            },
        });
        if (!timeout) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Activity timeout not set",
                    },
                ],
            });
        }
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Activity timeout is \`${timeout.value}\``,
                },
            ],
        });
    }

    private async ignoreChannel(command: ChatInputCommandInteraction) {
        // client.db.settings where name = activity_ignored and value is a stringified array of channel_ids
        const channel = command.options.getChannel("channel") as GuildChannel;
        const ignored = await this.client.db.settings.findUnique({
            where: {
                name: "activity_ignored",
            },
        });
        if (!ignored) {
            await this.client.db.settings.create({
                data: {
                    name: "activity_ignored",
                    value: JSON.stringify([channel.id]),
                },
            });
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Green,
                        title: "✅ Success",
                        description: `Channel ${channel.toString()} is now ignored`,
                    },
                ],
            });
        }
        const channels = JSON.parse(ignored.value) as string[];
        if (channels.includes(channel.id)) {
            const index = channels.indexOf(channel.id);
            channels.splice(index, 1);
            await this.client.db.settings.update({
                where: {
                    name: "activity_ignored",
                },
                data: {
                    value: JSON.stringify(channels),
                },
            });
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Green,
                        title: "✅ Success",
                        description: `Channel ${channel.toString()} is no longer ignored`,
                    },
                ],
            });
        }
        channels.push(channel.id);
        await this.client.db.settings.update({
            where: {
                name: "activity_ignored",
            },
            data: {
                value: JSON.stringify(channels),
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Channel ${channel.toString()} is now ignored`,
                },
            ],
        });
    }

    private async listChannels(command: ChatInputCommandInteraction) {
        const ignored = await this.client.db.settings.findUnique({
            where: {
                name: "activity_ignored",
            },
        });
        if (!ignored) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Green,
                        title: "✅ Success",
                        description: "No channels are ignored",
                    },
                ],
            });
        }
        const channelIds = JSON.parse(ignored.value) as string[];
        const channels = (
            await Promise.all(
                channelIds.map(async channelId => {
                    const channel = await command.guild.channels.fetch(channelId);
                    if (!channel) {
                        return;
                    }
                    return channel.toString();
                })
            )
        ).filter(channel => !!channel);

        if (channels.length != channelIds.length) {
            await this.client.db.settings.update({
                where: {
                    name: "activity_ignored",
                },
                data: {
                    value: JSON.stringify(channelIds),
                },
            });
        }

        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: channels.length > 0 ? channels.join(", ") : "No channels are ignored",
                },
            ],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        const subcommand = command.options.getSubcommand();
        const group = command.options.getSubcommandGroup();
        switch (subcommand) {
            case "threshold":
                if (command.options.getNumber("number")) {
                    await this.setThreshold(command);
                } else {
                    await this.getThreshold(command);
                }
                break;
            case "role":
                if (command.options.getRole("role")) {
                    await this.setRole(command);
                } else {
                    await this.getRole(command);
                }
                break;
            case "timeout":
                if (command.options.getNumber("number")) {
                    await this.setTimeout(command);
                } else {
                    await this.getTimeout(command);
                }
                break;
            default:
                console.log("Unknown subcommand", subcommand);
        }
        switch (group) {
            case "channels":
                switch (subcommand) {
                    case "ignore":
                        await this.ignoreChannel(command);
                        break;
                    case "list":
                        await this.listChannels(command);
                        break;
                }
        }
    }
}
