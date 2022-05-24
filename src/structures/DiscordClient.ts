import { Client, ClientOptions } from 'discord.js';
import { IConfig } from '@utils/interfaces';
import { BotOptions } from '@structures/types';
import Registry from '@classes/Registry';

export default class DiscordClient extends Client {
    public readonly config: IConfig;
    public readonly registry: Registry;

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
