import { ChannelType, ChatInputCommandInteraction, Colors, PermissionsBitField } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class AuditChannelsCommand extends Command {
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
                .setName("audit_channels")
                .setDescription("Alter thread channels")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("add")
                        .setDescription("Add a audit channel")
                        .addChannelOption(option => option.setName("channel").setDescription("The channel to add").setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("add_queue")
                        .setDescription("Add a audit channel with a queue")
                        .addChannelOption(option => option.setName("channel").setDescription("The channel to add").setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("remove")
                        .setDescription("Remove a audit channel")
                        .addChannelOption(option => option.setName("channel").setDescription("The channel to remove").setRequired(true))
                )
                .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all audit channels"))
        );
    }

    private async addAuditChannel(command: ChatInputCommandInteraction, queue = false) {
        if (command.options.getChannel("channel")!.type != ChannelType.GuildVoice) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Channel must be a voice channel",
                    },
                ],
            });
        }
        await this.client.db.auditChannels.create({
            data: {
                channel: command.options.getChannel("channel")!.id,
                queue: queue,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Added audit channel ${command.options.getChannel("channel")!.toString()}`,
                },
            ],
        });
    }

    private async removeAuditChannel(command: ChatInputCommandInteraction) {
        await this.client.db.auditChannels.deleteMany({
            where: {
                channel: command.options.getChannel("channel")!.id,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Removed audit channel ${command.options.getChannel("channel")!.toString()}`,
                },
            ],
        });
    }

    private async listAuditChannels(command: ChatInputCommandInteraction) {
        const auditChannels = await this.client.db.auditChannels.findMany();
        if (!auditChannels)
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Failed to get audit channels",
                    },
                ],
            });
        type AuditVoice = typeof auditChannels[0] & { available: boolean };
        const voiceChannels = [] as AuditVoice[];
        const auditors = await this.client.db.hacksAuditors.findMany({});
        for (let auditChannel of auditChannels) {
            const channel = await command.guild.channels.fetch(auditChannel.channel, { force: true });
            if (!channel || channel.type != ChannelType.GuildVoice) {
                continue;
            }
            if (auditChannel.queue) {
                voiceChannels.push({
                    ...auditChannel,
                    available: true,
                });
                continue;
            }

            voiceChannels.push({
                ...auditChannel,
                available: channel.members.every(m => auditors.map(a => a.userId).includes(m.id)),
            });
        }

        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "📁 Audit Channels",
                    description:
                        voiceChannels.length > 0
                            ? voiceChannels
                                  .map(channel => `${channel.available ? "🟢" : "🔴"} ${this.client.channels.cache.get(channel.channel)}${channel.queue ? " (Queue)" : ""}`)
                                  .join("\n")
                            : "No audit channels",
                },
            ],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        switch (command.options.getSubcommand()) {
            case "add":
                await this.addAuditChannel(command);
                break;
            case "add_queue":
                await this.addAuditChannel(command, true);
                break;
            case "remove":
                await this.removeAuditChannel(command);
                break;
            case "list":
                await this.listAuditChannels(command);
                break;
        }
    }
}
