import { CommandInteraction, Message } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';

import Logger from '../../classes/Logger';
import Command from '../../structures/Command';
import DiscordClient from '../../structures/DiscordClient';

export default class RebootCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                name: 'reboot',
                group: 'Developer',
                description: 'Reboots the bot.',
                require: {
                    developer: true
                }
            },
            new SlashCommandBuilder().setName('reboot').setDescription('Reboots the bot.')
        );
    }

    async run(command: CommandInteraction) {
        Logger.log('WARNING', `Bot rebooting... (Requested by ${command.user.toString()})`, true);

        // Destroying client so we can work without bugs
        this.client.destroy();

        // Reregistering commands, events and resetting command cooldowns and groups.
        this.client.registry.reregisterAll();

        // Running the client again
        // Don't call login method async
        this.client.login(this.client.config.token).then(async () => {
            // Emitting ready event
            this.client.emit('ready');

            // Sending message to channel for feedback
            await command.reply({
                embeds: [
                    {
                        color: 'GREEN',
                        description: `${command.user.toString()}, bot rebooted successfully.`
                    }
                ]
            });
        });
    }
}
