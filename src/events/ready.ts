import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class ReadyEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'ready');
    }

    async run() {
        Logger.log('SUCCESS', `Logged in as "${this.client.user?.tag}".`);
        this.client.db.threadchannels.count().then(count => Logger.log('SUCCESS', `Loaded ${count} thread channels.`));
        this.client.db.reactionroles.count().then(count => Logger.log('SUCCESS', `Loaded ${count} reaction roles.`));
    }
}
