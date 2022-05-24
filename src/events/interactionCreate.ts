import { Interaction } from 'discord.js';

import CommandHandler from '../classes/CommandHandler';
import DiscordClient from '../structures/DiscordClient';
import Event from '../structures/Event';

export default class MessageEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'interactionCreate');
    }

    async run(interaction: Interaction) {
        if (interaction.isCommand()) await CommandHandler.handleCommand(this.client, interaction);
    }
}
