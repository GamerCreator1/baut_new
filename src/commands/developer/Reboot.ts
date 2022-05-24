import { CommandInteraction } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';

import Logger from '@classes/Logger';
import Command from '@structures/Command';
import DiscordClient from '@structures/DiscordClient';

export default class RebootCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'Developer',
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
        this.client.login(this.client.token).then(async () => {
            // Emitting ready event
            this.client.emit('ready');

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
