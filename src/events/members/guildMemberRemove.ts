import { GuildMember, MessageEmbedOptions, TextBasedChannel } from 'discord.js';

import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class GuildMemberAddEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'guildMemberRemove', 'Members');
    }

    async run(member: GuildMember) {
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Members',
                enabled: true
            }
        });
        if (log) {
            const logChannel = member.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            const auditLogChannelBans = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_ADD' });
            const auditLogChannelKicks = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' });
            if (
                (!!auditLogChannelBans?.entries.first() && auditLogChannelBans.entries.first().target.id == member.id) ||
                (!!auditLogChannelKicks?.entries.first() && auditLogChannelKicks.entries.first().target.id == member.id)
            )
                return;
            if (logChannel) {
                const embed = {
                    author: { name: 'Members' },
                    color: 'DARK_PURPLE',
                    title: 'Member Left',
                    fields: [
                        {
                            name: 'Member',
                            value: member.user.toString(),
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                } as MessageEmbedOptions;

                await logChannel.send({
                    embeds: [embed]
                });
            }
        }
    }
}
