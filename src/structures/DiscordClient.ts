import { Client, ClientOptions } from 'discord.js';
import { BotOptions } from '@utils/types';

import Registry from '@classes/Registry';
import config from '../config';

export default class DiscordClient extends Client {
    public readonly config = config;
    public readonly registry = new Registry(this);

    constructor(baseOpts: ClientOptions, opts: BotOptions) {
        super(baseOpts);

        this.token = opts.token;
        this.owners = opts.owners;
    }

    /**
     * @returns The result of logging in
     * @public
     */
    public async load(): Promise<void> {
        this.registry.registerAll();
        super.login(this.token as string);
    }
}
