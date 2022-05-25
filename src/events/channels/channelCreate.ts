import { GuildChannel, TextBasedChannel } from 'discord.js';

import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class ChannelCreateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'channelCreate', 'Channels');
    }

    async run(channel: GuildChannel) {
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Channels',
                enabled: true
            }
        });
        if (log) {
            const logChannel = channel.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            const auditLogChannel = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_CREATE' });
            if (logChannel && auditLogChannel?.entries.first()) {
                let type: string;
                switch (channel.type) {
                    case 'GUILD_TEXT':
                        type = '💬 Text';
                        break;
                    case 'GUILD_VOICE':
                        type = '🔊 Voice';
                        break;
                    case 'GUILD_NEWS':
                        type = '📰 News';
                        break;
                    case 'GUILD_STORE':
                        type = '🛒 Store';
                        break;
                    case 'GUILD_PRIVATE_THREAD':
                    case 'GUILD_PUBLIC_THREAD':
                        type = '🧵 Thread';
                        break;
                    default:
                        type = '📁 Category';
                        break;
                }
                await logChannel.send({
                    embeds: [
                        {
                            author: { name: 'Channels' },
                            color: 'DARK_PURPLE',
                            title: `${type} Channel Created`,
                            fields: [
                                {
                                    name: 'Name',
                                    value: channel.name,
                                    inline: true
                                },
                                {
                                    name: 'Created by',
                                    value: auditLogChannel.entries.first()?.executor.toString() ?? 'Unknown',
                                    inline: true
                                }
                            ],
                            timestamp: channel.createdAt,
                            footer: {
                                text: `ID: ${channel.id}`
                            }
                        }
                    ]
                });
            }
        }
    }
}
