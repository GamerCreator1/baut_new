import { Message, MessageEmbedOptions, TextBasedChannel } from 'discord.js';

import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class MessageUpdateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'messageUpdate', 'Messages');
    }

    async run(oldMessage: Message, newMessage: Message) {
        if (oldMessage.author.bot) return;
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Messages',
                enabled: true
            }
        });
        if (log) {
            const logChannel = newMessage.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            if (logChannel) {
                const embed = {
                    author: { name: 'Messages' },
                    title: 'Message Updated',
                    color: 'DARK_PURPLE',
                    fields: [],
                    timestamp: new Date(),
                    footer: {
                        text: 'Author ID: ' + newMessage.author.id
                    }
                } as MessageEmbedOptions;
                if (oldMessage.content !== newMessage.content) {
                    embed.fields.push({
                        name: 'Old Content',
                        value: oldMessage.content,
                        inline: false
                    });
                    embed.fields.push({
                        name: 'New Content',
                        value: newMessage.content,
                        inline: false
                    });
                }
                embed.fields.push(
                    {
                        name: 'Author',
                        value: newMessage.author.toString(),
                        inline: true
                    },
                    {
                        name: 'Channel',
                        value: newMessage.channel.toString(),
                        inline: false
                    }
                );
                await logChannel.send({ embeds: [embed] });
            }
        }
    }
}
