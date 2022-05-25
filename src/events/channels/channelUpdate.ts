import {
    DMChannel, GuildChannel, MessageEmbedOptions, TextBasedChannel, TextChannel
} from 'discord.js';

import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class ChannelUpdateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'channelUpdate', 'Channels');
    }

    async run(oldChannel: GuildChannel | DMChannel, newChannel: GuildChannel | DMChannel) {
        if (newChannel instanceof DMChannel || oldChannel instanceof DMChannel) return;
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Channels',
                enabled: true
            }
        });
        if (log) {
            const logChannel = newChannel.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            const auditLogChannel = await newChannel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_UPDATE' });
            if (logChannel && auditLogChannel?.entries.first()) {
                let type: string;
                switch (newChannel.type) {
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
                const embed = {
                    color: 'DARK_PURPLE',
                    title: `${type} channel updated`,
                    fields: [
                        {
                            name: 'Name',
                            value: oldChannel.name === newChannel.name ? newChannel.name : `${oldChannel.name} -> ${newChannel.name}`,
                            inline: true
                        },
                        {
                            name: 'Updated by',
                            value: auditLogChannel.entries.first()?.executor.toString() ?? 'Unknown',
                            inline: true
                        }
                    ],
                    timestamp: Date.now(),
                    footer: {
                        text: `ID: ${newChannel.id}`
                    }
                } as MessageEmbedOptions;
                if (oldChannel.type == 'GUILD_TEXT') {
                    const oldTextChannel = oldChannel as TextChannel;
                    const newTextChannel = newChannel as TextChannel;
                    if (oldTextChannel.topic != newTextChannel.topic) {
                        embed.fields.push({
                            name: 'Topic',
                            value: oldTextChannel.topic === newTextChannel.topic ? newTextChannel.topic : `${oldTextChannel.topic ?? 'N/A'} -> ${newTextChannel.topic ?? 'N/A'}`,
                            inline: true
                        });
                    }
                    if (oldTextChannel.rateLimitPerUser != newTextChannel.rateLimitPerUser) {
                        embed.fields.push({
                            name: 'Slowmode(s)',
                            value: `${oldTextChannel.rateLimitPerUser} -> ${newTextChannel.rateLimitPerUser}`,
                            inline: true
                        });
                    }
                }

                logChannel.send({ embeds: [embed] });
            }
        }
    }
}
