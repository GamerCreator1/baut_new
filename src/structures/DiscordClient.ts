import { Client, ClientOptions } from "discord.js";
import { BotOptions } from "@utils/types";
import { prisma } from "../providers/prisma";

import Registry from "@classes/Registry";
import config from "../config";
export default class DiscordClient extends Client {
    public readonly config = config;
    public readonly registry = new Registry(this);
    public readonly db = prisma;

    constructor(baseOpts: ClientOptions, opts: BotOptions) {
        super(baseOpts);

        this.token = opts.token;
        this.owners = opts.owners;
        this.db = this.db;
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
