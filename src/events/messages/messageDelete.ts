import { Message, MessageEmbedOptions, TextBasedChannel } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class MessageDeleteEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "messageDelete", "Messages");
    }

    async run(message: Message) {
        if (message.author.bot) return;
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: "Messages",
                enabled: true,
            },
        });
        if (log) {
            const auditLogChannel = await message.guild.fetchAuditLogs({ limit: 1, type: "MESSAGE_DELETE" });
            const embed = {
                author: { name: "Messages" },
                title: "Message Deleted",
                color: "DARK_PURPLE",
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
            } as MessageEmbedOptions;
            if (auditLogChannel.entries.first().target.id === message.author.id) {
                embed.fields.push({
                    name: "Deleted by",
                    value: auditLogChannel.entries.first()?.executor.toString() ?? "Unknown",
                    inline: true,
                });
            }
            Logger.logEvent(this.client, message.guild, "Messages", embed);
        }
    }
}
