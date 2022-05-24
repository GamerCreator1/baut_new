import { CommandInteraction } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';

import { prisma } from '../../providers/prisma';
import Command from '../../structures/Command';
import DiscordClient from '../../structures/DiscordClient';

export default class AddThreadChannelCommand extends Command {
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
                .setName('thread_channels')
                .setDescription('Alter thread channels')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add a thread channel')
                        .addChannelOption(option => option.setName('channel').setDescription('The channel to add').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove a thread channel')
                        .addChannelOption(option => option.setName('channel').setDescription('The channel to remove').setRequired(true))
                )
                .addSubcommand(subcommand => subcommand.setName('list').setDescription('List all thread channels'))
        );
    }

    private async addThreadChannel(command: CommandInteraction) {
        await prisma?.threadchannels.create({
            data: {
                channel_id: command.options.getChannel('channel')!.id
            }
        });
        return command.reply({
            embeds: [
                {
                    color: 'GREEN',
                    title: '✅ Success',
                    description: `Added thread channel ${command.options.getChannel('channel')!.toString()}`
                }
            ]
        });
    }

    private async removeThreadChannel(command: CommandInteraction) {
        await prisma?.threadchannels.deleteMany({
            where: {
                channel_id: command.options.getChannel('channel')!.id
            }
        });
        return command.reply({
            embeds: [
                {
                    color: 'GREEN',
                    title: '✅ Success',
                    description: `Removed thread channel ${command.options.getChannel('channel')!.toString()}`
                }
            ]
        });
    }

    private async listThreadChannels(command: CommandInteraction) {
        const threadChannels = await prisma?.threadchannels.findMany({
            select: {
                channel_id: true
            }
        });
        if (!threadChannels)
            return command.reply({
                embeds: [
                    {
                        color: 'RED',
                        title: '❌ Error',
                        description: 'Failed to get thread channels'
                    }
                ]
            });
        const channels = threadChannels.map(threadChannel => this.client.channels.cache.get(threadChannel.channel_id));
        return command.reply({
            embeds: [
                {
                    color: 'GREEN',
                    title: '📁 Thread Channels',
                    description: channels.length > 0 ? channels.map(channel => channel?.toString()).join('\n') : 'No thread channels'
                }
            ]
        });
    }

    async run(command: CommandInteraction) {
        switch (command.options.getSubcommand()) {
            case 'add':
                await this.addThreadChannel(command);
                break;
            case 'remove':
                await this.removeThreadChannel(command);
                break;
            case 'list':
                await this.listThreadChannels(command);
                break;
        }
    }
}
