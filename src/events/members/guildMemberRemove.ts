import { GuildMember, TextBasedChannel, Colors, EmbedBuilder, AuditLogEvent } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class GuildMemberAddEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "guildMemberRemove", "Members");
    }

    async run(member: GuildMember) {
        const auditLogChannelBans = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
        const auditLogChannelKicks = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
        if (
            (!!auditLogChannelBans?.entries.first() && auditLogChannelBans.entries.first().target.id == member.id) ||
            (!!auditLogChannelKicks?.entries.first() && auditLogChannelKicks.entries.first().target.id == member.id)
        )
            return;
        const embed = {
            author: { name: "Members" },
            color: Colors.DarkPurple,
            title: "Member Left",
            fields: [
                {
                    name: "Member",
                    value: member.user.toString(),
                    inline: true,
                },
            ],
            timestamp: new Date(),
        };
        Logger.logEvent(this.client, member.guild, "Members", new EmbedBuilder(embed));
    }
}
