import { CommandInteraction } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';

import Command from '@structures/Command';
import DiscordClient from '@structures/DiscordClient';

export default class TestCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'Developer',
                require: {
                    developer: true
                }
            },
            new SlashCommandBuilder().setName('debug').setDescription('Test command for developers')
        );
    }

    async run(command: CommandInteraction) {
        await command.reply('Test command working!');
    }
}
