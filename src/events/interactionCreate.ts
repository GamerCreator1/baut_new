import { Interaction } from 'discord.js';

import CommandHandler from '@classes/CommandHandler';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class InteractionEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'interactionCreate', false);
    }

    async run(interaction: Interaction) {
        if (interaction.isCommand()) await CommandHandler.handleCommand(this.client, interaction);
        if (interaction.isAutocomplete()) CommandHandler.handleAutocomplete(this.client, interaction);
    }
}
