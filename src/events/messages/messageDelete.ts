import { Message, TextBasedChannel, Colors, EmbedBuilder, AuditLogEvent } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class MessageDeleteEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "messageDelete", "Messages");
    }

    async run(message: Message) {
        if (message.author.bot) return;
        const auditLogChannel = await message.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete });
        const embed = {
            author: { name: "Messages" },
            title: "Message Deleted",
            color: Colors.DarkPurple,
            fields: [
                {
                    name: "Message",
                    value: message.content,
                    inline: true,
                },
                {
                    name: "Author",
                    value: message.author.toString(),
                    inline: true,
                },
                {
                    name: "Channel",
                    value: message.channel.toString(),
                    inline: false,
                },
            ],
            timestamp: new Date(),
            footer: {
                text: "Author ID: " + message.author.id,
            },
        };
        if (auditLogChannel.entries.first().target.id === message.author.id) {
            embed.fields.push({
                name: "Deleted by",
                value: auditLogChannel.entries.first()?.executor.toString() ?? "Unknown",
                inline: true,
            });
        }
        Logger.logEvent(this.client, message.guild, "Messages", new EmbedBuilder(embed));
    }
}
