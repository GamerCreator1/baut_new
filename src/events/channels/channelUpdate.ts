import { DMChannel, GuildChannel, TextBasedChannel, TextChannel, Colors, ChannelType, EmbedBuilder, AuditLogEvent } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class ChannelUpdateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "channelUpdate", "Channels");
    }

    async run(oldChannel: GuildChannel | DMChannel, newChannel: GuildChannel | DMChannel) {
        if (newChannel instanceof DMChannel || oldChannel instanceof DMChannel) return;
        const auditLogChannel = await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate });
        if (auditLogChannel?.entries.first()) {
            let type: string;
            switch (newChannel.type) {
                case ChannelType.GuildText:
                    type = "💬 Text";
                    break;
                case ChannelType.GuildVoice:
                    type = "🔊 Voice";
                    break;
                case ChannelType.GuildAnnouncement:
                    type = "📰 News";
                    break;
                case ChannelType.PrivateThread:
                case ChannelType.PublicThread:
                    type = "🧵 Thread";
                    break;
                default:
                    type = "📁 Category";
                    break;
            }
            const embed = {
                author: { name: "Channels" },
                color: Colors.DarkPurple,
                title: `${type} Channel Updated`,
                fields: [
                    {
                        name: "Name",
                        value: oldChannel.name === newChannel.name ? newChannel.name : `${oldChannel.name} -> ${newChannel.name}`,
                        inline: true,
                    },
                    {
                        name: "Updated by",
                        value: auditLogChannel.entries.first()?.executor.toString() ?? "Unknown",
                        inline: true,
                    },
                ],
                timestamp: Date.now(),
                footer: {
                    text: `ID: ${newChannel.id}`,
                },
            };
            if (oldChannel.type == ChannelType.GuildText) {
                const oldTextChannel = oldChannel as TextChannel;
                const newTextChannel = newChannel as TextChannel;
                if (oldTextChannel.topic != newTextChannel.topic) {
                    embed.fields.push({
                        name: "Topic",
                        value: oldTextChannel.topic === newTextChannel.topic ? newTextChannel.topic : `${oldTextChannel.topic ?? "N/A"} -> ${newTextChannel.topic ?? "N/A"}`,
                        inline: true,
                    });
                }
                if (oldTextChannel.rateLimitPerUser != newTextChannel.rateLimitPerUser) {
                    embed.fields.push({
                        name: "Slowmode(s)",
                        value: `${oldTextChannel.rateLimitPerUser} -> ${newTextChannel.rateLimitPerUser}`,
                        inline: true,
                    });
                }
                if (oldTextChannel.nsfw != newTextChannel.nsfw) {
                    embed.fields.push({
                        name: "NSFW",
                        value: `${oldTextChannel.nsfw} -> ${newTextChannel.nsfw}`,
                        inline: true,
                    });
                }
                Logger.logEvent(this.client, newChannel.guild, "Channels", new EmbedBuilder(embed));
            }
        }
    }
}
