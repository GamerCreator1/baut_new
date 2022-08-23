import { GuildChannel, TextBasedChannel, Colors, EmbedBuilder, ChannelType, AuditLogEvent } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class ChannelCreateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "channelCreate", "Channels");
    }

    async run(channel: GuildChannel) {
        const auditLogChannel = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
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
                title: `${type} Channel Created`,
                fields: [
                    {
                        name: "Name",
                        value: channel.name,
                        inline: true,
                    },
                    {
                        name: "Created by",
                        value: auditLogChannel.entries.first()?.executor.toString() ?? "Unknown",
                        inline: true,
                    },
                ],
                timestamp: channel.createdAt,
                footer: {
                    text: `ID: ${channel.id}`,
                },
            };
            Logger.logEvent(this.client, channel.guild, "Channels", new EmbedBuilder(embed));
        }
    }
}
