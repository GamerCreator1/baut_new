import { GuildBan, MessageEmbedOptions, TextBasedChannel } from 'discord.js';

import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class GuildBanEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'guildBanRemove', 'Members');
    }

    async run(ban: GuildBan) {
        const auditLogChannel = await ban.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_REMOVE' });
        if (auditLogChannel?.entries.first()) {
            const embed = {
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
            } as MessageEmbedOptions;
            Logger.logEvent(this.client, ban.guild, 'Members', embed);
        }
    }
}
