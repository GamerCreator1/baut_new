import { GuildBan, TextBasedChannel } from 'discord.js';

import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class GuildBanEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'guildBanRemove', 'Members');
    }

    async run(ban: GuildBan) {
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Members',
                enabled: true
            }
        });
        if (log) {
            const logChannel = ban.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            const auditLogChannel = await ban.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_REMOVE' });
            if (logChannel && auditLogChannel?.entries.first()) {
                await logChannel.send({
                    embeds: [
                        {
                            author: { name: 'Members' },
                            color: 'DARK_PURPLE',
                            title: 'Member Unbanned',
                            fields: [
                                {
                                    name: 'Member',
                                    value: ban.user.toString(),
                                    inline: true
                                },
                                {
                                    name: 'Unbanned by',
                                    value: auditLogChannel.entries.first()?.executor.toString() ?? 'Unknown',
                                    inline: true
                                }
                            ],
                            timestamp: new Date()
                        }
                    ]
                });
            }
        }
    }
}
