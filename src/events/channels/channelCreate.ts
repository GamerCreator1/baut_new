import { GuildChannel, MessageEmbedOptions, TextBasedChannel } from 'discord.js';

import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class ChannelCreateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'channelCreate', 'Channels');
    }

    async run(channel: GuildChannel) {
        const auditLogChannel = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_CREATE' });
        if (auditLogChannel?.entries.first()) {
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
            const embed = {
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
            } as MessageEmbedOptions;
            Logger.logEvent(this.client, channel.guild, 'Channels', embed);
        }
    }
}
