import { CommandInteraction, Message } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';

import Command from '../../structures/Command';
import DiscordClient from '../../structures/DiscordClient';

export default class TestCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                name: 'test',
                group: 'Developer',
                description: 'Test command for developers',
                require: {
                    developer: true
                }
            },
            new SlashCommandBuilder().setName('test').setDescription('Test command for developers')
        );
    }

    async run(command: CommandInteraction) {
        await command.reply('Test command working!');
    }
}
