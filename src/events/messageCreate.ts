import { Message } from 'discord.js';

import CommandHandler from '../classes/CommandHandler';
import DiscordClient from '../structures/DiscordClient';
import Event from '../structures/Event';

export default class MessageEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'messageCreate');
    }

    async run(message: Message) {
        if (message.author.bot || message.channel.type === 'DM') return;
        await prisma?.threadchannels.findMany().then(async threadChannels => {
            if (threadChannels.some(threadChannel => threadChannel.channel_id === message.channel.id)) {
                await message.startThread({
                    name: message.content,
                    autoArchiveDuration: 1440,
                    reason: '[Baut AutoThread] Thread created for ' + message.author.tag
                });
                return;
            }
        });
    }
}
