import { Interaction, ActionRowBuilder, EmbedBuilder, MessageOptions, MessageActionRowComponentBuilder, Colors } from "discord.js";

import Logger from "@classes/Logger";

import DiscordClient from "./DiscordClient";

export default abstract class Embed {
    /** Name of this embed */
    readonly name: string;

    /** Embed object to be sent */
    readonly embed: EmbedBuilder;

    /** Components to be sent with the message */
    readonly components: ActionRowBuilder<MessageActionRowComponentBuilder>[];

    /** A list of customIds this embed needs to be notified of. */
    readonly interactionIds: string[];

    /** An internal ID */
    readonly id: string;

    /** If this embed shouldn't be listed when the client calls the "show embeds" command */
    readonly hideFromClient: boolean;

    static numEmbeds: number = 0;

    constructor(name: string, embed: EmbedBuilder, interactionIds: string[], components?: ActionRowBuilder<MessageActionRowComponentBuilder>[], hideFromClient?: boolean) {
        this.name = name;
        this.embed = embed;
        this.components = components;
        this.interactionIds = interactionIds;
        this.id = "E" + Embed.numEmbeds++;
        this.hideFromClient = hideFromClient;
    }

    /**
     * Handles any interactions with the message
     * @param interaction
     * @param client
     */
    abstract onInteraction(interaction: Interaction, client: DiscordClient): Promise<void>;

    async onError() {
        Logger.log("WARNING", `An error occured in Embed ${this.id}: ${this.name}`);
    }
}
