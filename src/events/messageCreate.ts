import { DMChannel, Message, ThreadChannel } from 'discord.js';

import CommandHandler from '@classes/CommandHandler';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class MessageEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'messageCreate', false);
    }

    async run(message: Message) {
        if (message.author.bot || message.channel.type === 'DM') return;
        if (message.channel.type == 'GUILD_TEXT') {
            await this.client.db.threadchannels.findMany().then(async threadChannels => {
                // @ts-ignore
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
        const urlFilter = new RegExp('[\\w]{1,1}[a-zA-Z0-9@:%._+~#=-]{0,256}\\.[a-zA-Z]{1,1}[a-zA-Z0-9()]{1,5}[\\/a-zA-z0-9\\-?=&%.,+]*\\b');
        const url = urlFilter.exec(message.content);
        if (url && url.length > 0 && url[0].length >= 4 && !url[0].match('[.]{2,}')) {
            const domain = url[0].match('[\\w]{1,1}[a-zA-Z0-9@:%._+~#=-]{0,256}\\.[a-zA-Z]{1,1}[a-zA-Z0-9()]{1,5}\\b');
            if (domain.length == 0) return;
            const domainName = domain[0];
            const isBlackListedChannel = await this.client.db.nolinkchannels.findFirst({
                where: {
                    channel_id: message.channel.id
                }
            });
            if (isBlackListedChannel) {
                const isBlackListed = await this.client.db.blacklistedlinks.findFirst({
                    where: {
                        link: domainName
                    }
                });
                if (isBlackListed) {
                    await message.delete();
                    return;
                }
            }
        }
    }
}
