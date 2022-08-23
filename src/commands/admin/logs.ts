import { ChatInputCommandInteraction, ColorResolvable, Colors, EmbedBuilder, PermissionsBitField } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class LogsCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "Admin",
                require: {
                    permissions: [PermissionsBitField.Flags.ManageGuild],
                },
            },
            new SlashCommandBuilder()
                .setName("logs")
                .setDescription("Manage BuilderBaut logs")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("enable")
                        .setDescription("Enable a log category")
                        .addStringOption(option =>
                            option.setName("category").setDescription("The category to enable").setRequired(true).addChoices(
                                {
                                    name: "Messages",
                                    value: "Messages",
                                },
                                {
                                    name: "Members",
                                    value: "Members",
                                },
                                {
                                    name: "Channels",
                                    value: "Channels",
                                }
                            )
                        )
                        .addChannelOption(option => option.setName("channel").setDescription("The channel to enable logs in").setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("disable")
                        .setDescription("Disable a log category")
                        .addStringOption(option =>
                            option.setName("category").setDescription("The category to enable").setRequired(true).addChoices(
                                {
                                    name: "Messages",
                                    value: "Messages",
                                },
                                {
                                    name: "Members",
                                    value: "Members",
                                },
                                {
                                    name: "Channels",
                                    value: "Channels",
                                }
                            )
                        )
                )
                .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all enabled log categories"))
        );
    }

    private async enable(command: ChatInputCommandInteraction) {
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: command.options.getString("category")!,
            },
        });
        if (log) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: `Logs for \`${command.options.getString("category")}\` are already enabled in <#${log.channel_id}>`,
                    },
                ],
            });
        } else {
            await this.client.db.log.create({
                data: {
                    log_event: command.options.getString("category")!,
                    channel_id: command.options.getChannel("channel")!.id,
                    enabled: true,
                },
            });
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Green,
                        title: "✅ Success",
                        description: `Enabled logs for \`${command.options.getString("category")}\``,
                    },
                ],
            });
        }
    }

    private async disable(command: ChatInputCommandInteraction) {
        await this.client.db.log.deleteMany({
            where: {
                log_event: command.options.getString("category")!,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Disabled logs for \`${command.options.getString("category")}\``,
                },
            ],
        });
    }

    private async list(command: ChatInputCommandInteraction) {
        const logs = await this.client.db.log.findMany();
        const embed = new EmbedBuilder()
            .setTitle("Logs")
            .setTimestamp(new Date())
            .setColor(process.env.BUILDERGROOP_COLOR as ColorResolvable);
        if (logs.length === 0) {
            embed.setDescription("No logs are enabled for this channel");
        } else {
            embed.setFields(
                logs.map(log => ({
                    name: log.log_event,
                    value: "<#" + log.channel_id + ">",
                }))
            );
        }
        return command.editReply({
            embeds: [embed],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        switch (command.options.getSubcommand()) {
            case "enable":
                return this.enable(command);
            case "disable":
                return this.disable(command);
            case "list":
                return this.list(command);
        }
    }
}
