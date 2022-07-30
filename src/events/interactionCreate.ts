import { Interaction } from "discord.js";

import CommandHandler from "@classes/CommandHandler";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class InteractionEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "interactionCreate", false);
    }

    async run(interaction: Interaction) {
        if (interaction.isCommand()) return await CommandHandler.handleCommand(this.client, interaction);
        else if (interaction.isAutocomplete()) return CommandHandler.handleAutocomplete(this.client, interaction);
        else if (interaction.isMessageComponent()) {
            const id = interaction.customId;
            this.client.registry.getEmbeds().forEach(async embed => {
                if (embed.interactionIds.some(i => id.startsWith(i))) {
                    try {
                        embed.onInteraction(interaction, this.client);
                    } catch (e) {
                        await embed.onError();
                    }
                }
            });
        }
    }
}
