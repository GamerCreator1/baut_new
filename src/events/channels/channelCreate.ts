import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class ChannelEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'channelCreate', 'Channels');
    }

    async run() {}
}
