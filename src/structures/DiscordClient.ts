import { Client, IntentsString } from 'discord.js';

import Registry from '../classes/Registry';
import { IConfig } from '../utils/interfaces';

export default class DiscordClient extends Client {
    /**
     * Registry of the client.
     */
    readonly registry: Registry;

    /**
     * Config of the client.
     */
    readonly config: IConfig;

    constructor(intents: IntentsString[]) {
        super({ intents });

        /**
         * Setting up client's config.
         */
        const prod = process.env.NODE_ENV === 'production';
        this.config = {
            token: (prod ? process.env.TOKEN : process.env.TEST_TOKEN) as string,
            clientId: (prod ? process.env.CLIENT_ID : process.env.TEST_CLIENT_ID) as string,
            guildId: (prod ? process.env.GUILD_ID : process.env.TEST_GUILD_ID) as string,
            developers: JSON.parse(process.env.DEVELOPERS as string) as string[],
            unknownErrorMessage: JSON.parse(process.env.UNKNOWN_COMMAND_ERROR as string)
        };

        /**
         * Creating new registry class.
         */
        this.registry = new Registry(this);

        /**
         * Registering events and commands.
         */
        this.registry.registerAll();
    }
}
