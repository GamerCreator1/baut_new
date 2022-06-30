import { CommandInteraction, MessageActionRow, Modal, ModalActionRowComponent, TextInputComponent } from 'discord.js';

import Logger from '@classes/Logger';
import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '@structures/Command';
import DiscordClient from '@structures/DiscordClient';

export default class SayCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'Developer',
                require: {
                    developer: true
                }
            },
            new SlashCommandBuilder()
                .setName('test')
                .setDescription('Dev command')
                .addAttachmentOption(option => option.setName('attachment').setDescription('Attachment').setRequired(true))
        );
    }

    async run(command: CommandInteraction) {
        const attachment = command.options.getAttachment('attachment');
        const modal = new Modal()
            .setTitle('Test')
            .setCustomId('test')
            .addComponents(
                new MessageActionRow<ModalActionRowComponent>()
                    .addComponents([
                        new TextInputComponent()
                            .setLabel('Test')
                            .setStyle('SHORT')
                            .setCustomId('test-input')
                            .setValue(attachment.url)
                    ])
            )
        await command.deleteReply();
        // await command.showModal(modal);
    }
}
