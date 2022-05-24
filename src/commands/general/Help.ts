import { CommandInteraction, Message, MessageEmbed } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';

import Command from '../../structures/Command';
import DiscordClient from '../../structures/DiscordClient';
import { formatSeconds } from '../../utils/functions';

interface IGroup {
    name: string;
    commands: string[];
}

export default class HelpCommand extends Command {
    constructor(client: DiscordClient) {
        const commands = client.registry.getAllCommandNames().map(c => ({ name: c, value: c }));
        const builder = new SlashCommandBuilder()
            .setName('help')
            .setDescription('Shows information about commands and groups.')
            .addStringOption(option =>
                option
                    .setName('command_name')
                    .setDescription('The name of the command you want information about')
                    .setRequired(false)
                    .addChoices(...commands)
            ) as SlashCommandBuilder;
        super(
            client,
            {
                name: 'help',
                group: 'General',
                description: 'Shows information about commands and groups.',
                cooldown: 30
            },
            new SlashCommandBuilder()
                .setName('help')
                .setDescription('Shows information about commands and groups.')
                .addStringOption(option =>
                    option
                        .setName('command_name')
                        .setDescription('The name of the command you want information about')
                        .setRequired(false)
                        .addChoices(...commands)
                ) as SlashCommandBuilder
        );
    }

    getAvailableGroups(command: CommandInteraction): IGroup[] {
        const registry = this.client.registry;
        const groupKeys = registry.getAllGroupNames();
        const groups: IGroup[] = [];

        groupKeys.forEach(group => {
            const commandsInGroup = registry.findCommandsInGroup(group) as string[];
            const commands: string[] = [];

            commandsInGroup.forEach(commandName => {
                const commandObj = registry.findCommand(commandName) as Command;
                if (!commandObj.isUsable(command)) return;
                commands.push(commandName);
            });

            if (commands.length) groups.push({ name: group, commands });
        });

        return groups;
    }

    async sendHelpMessage(command: CommandInteraction, groups: IGroup[]) {
        const embed = new MessageEmbed({
            color: 'BLUE',
            title: 'Help',
            footer: {
                text: `Type "${this.client.config.prefix}help [command-name]" for more information.`
            }
        });

        groups.forEach(group => embed.addField(`${group.name} Commands`, group.commands.map(x => `\`${x}\``).join(' ')));
        await command.reply({ embeds: [embed], ephemeral: true });
    }

    async run(command: CommandInteraction) {
        const groups = this.getAvailableGroups(command);

        const option = command.options.getString('command_name');

        if (!option) return await this.sendHelpMessage(command, groups);

        const commandObj = this.client.registry.findCommand(option);
        if (!commandObj) return await this.sendHelpMessage(command, groups);
        var isAvailable = false;

        groups.forEach(group => {
            if (group.commands.includes(commandObj.info.name)) isAvailable = true;
        });

        if (!isAvailable) return await this.sendHelpMessage(command, groups);

        const embed = new MessageEmbed({
            color: 'BLUE',
            title: 'Help',
            fields: [
                {
                    name: 'Name',
                    value: commandObj.info.name
                },
                {
                    name: 'Group',
                    value: commandObj.info.group
                },
                {
                    name: 'Cooldown',
                    value: commandObj.info.cooldown ? formatSeconds(commandObj.info.cooldown) : 'No cooldown'
                },
                {
                    name: 'Usable At',
                    value: commandObj.info.onlyNsfw ? 'NSFW channels' : 'All text channels'
                },
                {
                    name: 'Aliases',
                    value: commandObj.info.aliases ? commandObj.info.aliases.map(x => `\`${x}\``).join(' ') : 'No aliases'
                },
                {
                    name: 'Example Usages',
                    value: commandObj.info.examples ? commandObj.info.examples.map(x => `\`${x}\``).join('\n') : 'No examples'
                },
                {
                    name: 'Description',
                    value: commandObj.info.description ? commandObj.info.description : 'No description'
                }
            ]
        });

        if (commandObj.info.require) {
            if (commandObj.info.require.developer) embed.setFooter('This is a developer command.');
            if (commandObj.info.require.permissions) embed.addField('Permission Requirements', commandObj.info.require.permissions.map(x => `\`${x}\``).join('\n'));
        }

        await command.reply({ embeds: [embed], ephemeral: true });
    }
}
