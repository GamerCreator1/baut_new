import { DMChannel, GuildChannel, TextBasedChannel, Colors, AuditLogEvent, ChannelType, EmbedBuilder } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class ChannelDeleteEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "channelDelete", "Channels");
    }

    async run(channel: GuildChannel | DMChannel) {
        if (channel instanceof DMChannel) return;
        const auditLogChannel = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
        if (auditLogChannel?.entries.first()) {
            let type: string;
            switch (channel.type) {
                case ChannelType.GuildText:
                    type = "💬 Text";
                    break;
                case ChannelType.GuildVoice:
                    type = "🔊 Voice";
                    break;
                case ChannelType.GuildNews:
                    type = "📰 News";
                    break;
                case ChannelType.GuildPrivateThread:
                case ChannelType.GuildPublicThread:
                    type = "🧵 Thread";
                    break;
                default:
                    type = "📁 Category";
                    break;
            }
            const embed = {
                author: { name: "Channels" },
                color: Colors.DarkPurple,
                title: `${type} Channel Deleted`,
                fields: [
                    {
                        name: "Name",
                        value: channel.name,
                        inline: true,
                    },
                    {
                        name: "Deleted by",
                        value: auditLogChannel.entries.first()?.executor.toString() ?? "Unknown",
                        inline: true,
                    },
                ],
                timestamp: Date.now(),
                footer: {
                    text: `ID: ${channel.id}`,
                },
            };
            Logger.logEvent(this.client, channel.guild, "Channels", new EmbedBuilder(embed));
        }
    }
}
