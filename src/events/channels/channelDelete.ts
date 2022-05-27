import { DMChannel, GuildChannel, MessageEmbedOptions, TextBasedChannel } from 'discord.js';

import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class ChannelDeleteEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'channelDelete', 'Channels');
    }

    async run(channel: GuildChannel | DMChannel) {
        if (channel instanceof DMChannel) return;
        const auditLogChannel = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_DELETE' });
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
                title: `${type} Channel Deleted`,
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
            } as MessageEmbedOptions;
            Logger.logEvent(this.client, channel.guild, 'Channels', embed);
        }
    }
}
