import { DMChannel, GuildChannel, TextBasedChannel } from 'discord.js';

import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class ChannelDeleteEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'channelDelete', 'Channels');
    }

    async run(channel: GuildChannel | DMChannel) {
        if (channel instanceof DMChannel) return;
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Channels',
                enabled: true
            }
        });
        if (log) {
            const logChannel = channel.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            const auditLogChannel = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_DELETE' });
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
                logChannel.send({
                    embeds: [
                        {
                            color: 'DARK_PURPLE',
                            title: `${type} channel deleted`,
                            fields: [
                                {
                                    name: 'Name',
                                    value: channel.name,
                                    inline: true
                                },
                                {
                                    name: 'Deleted by',
                                    value: auditLogChannel.entries.first()?.executor.toString() ?? 'Unknown',
                                    inline: true
                                }
                            ],
                            timestamp: Date.now(),
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
