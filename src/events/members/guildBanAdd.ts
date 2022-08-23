import { GuildBan, TextBasedChannel, Colors, EmbedBuilder, AuditLogEvent } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class GuildBanEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "guildBanAdd", "Members");
    }

    async run(ban: GuildBan) {
        const auditLogChannel = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
        if (auditLogChannel?.entries.first()) {
            const embed = {
                author: { name: "Members" },
                color: Colors.DarkPurple,
                title: "Member Banned",
                fields: [
                    {
                        name: "Member",
                        value: ban.user.toString(),
                        inline: true,
                    },
                    {
                        name: "Banned by",
                        value: auditLogChannel.entries.first()?.executor.toString() ?? "Unknown",
                        inline: true,
                    },
                ],
                timestamp: new Date(),
            };
            Logger.logEvent(this.client, ban.guild, "Members", new EmbedBuilder(embed));
        }
    }
}
