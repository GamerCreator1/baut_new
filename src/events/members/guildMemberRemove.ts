import { GuildMember, MessageEmbedOptions, TextBasedChannel } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class GuildMemberAddEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "guildMemberRemove", "Members");
    }

    async run(member: GuildMember) {
        const auditLogChannelBans = await member.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_BAN_ADD" });
        const auditLogChannelKicks = await member.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_KICK" });
        if (
            (!!auditLogChannelBans?.entries.first() && auditLogChannelBans.entries.first().target.id == member.id) ||
            (!!auditLogChannelKicks?.entries.first() && auditLogChannelKicks.entries.first().target.id == member.id)
        )
            return;
        const embed = {
            author: { name: "Members" },
            color: "DARK_PURPLE",
            title: "Member Left",
            fields: [
                {
                    name: "Member",
                    value: member.user.toString(),
                    inline: true,
                },
            ],
            timestamp: new Date(),
        } as MessageEmbedOptions;
        Logger.logEvent(this.client, member.guild, "Members", embed);
    }
}
