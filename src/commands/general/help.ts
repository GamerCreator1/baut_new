import { ChatInputCommandInteraction, GuildMember, EmbedBuilder, Colors, PermissionResolvable } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";
import { formatSeconds, isUserDeveloper } from "@utils/functions";

interface IGroup {
    name: string;
    commands: string[];
}

export default class HelpCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "General",
                cooldown: 30,
                autocomplete: () => client.registry.getAllCommandNames().map(c => ({ name: c, value: c })) ?? [],
            },
            new SlashCommandBuilder()
                .setName("help")
                .setDescription("Shows information about commands and groups.")
                .addStringOption(option =>
                    option.setName("command_name").setDescription("The name of the command you want information about").setRequired(false).setAutocomplete(true)
                ) as SlashCommandBuilder
        );
    }

    getAvailableGroups(command: ChatInputCommandInteraction): IGroup[] {
        const registry = this.client.registry;
        const groupKeys = registry.getAllGroupNames();
        const groups: IGroup[] = [];

        groupKeys.forEach(group => {
            const commandsInGroup = registry.findCommandsInGroup(group) as string[];
            const commands: string[] = [];

            commandsInGroup.forEach(commandName => {
                const commandObj = registry.findCommand(commandName) as Command;
                if (!commandObj.isUsable(command)) return;
                if (commandObj.info.require && commandObj.info.require.permissions && !isUserDeveloper(this.client, command.user.id)) {
                    const hasPerms = commandObj.info.require.permissions.every(perm => (command.member as GuildMember).permissions.has(perm as PermissionResolvable));
                    if (!hasPerms) return;
                }
                commands.push(commandName);
            });

            if (commands.length) groups.push({ name: group, commands });
        });

        return groups;
    }

    async sendHelpMessage(command: ChatInputCommandInteraction, groups: IGroup[]) {
        const embed = new EmbedBuilder({
            color: Colors.Blue,
            title: "Help",
            footer: {
                text: `Type "/help [command-name]" for more information.`,
            },
        });

        groups.forEach(group => embed.addFields([{ name: `${group.name} Commands`, value: group.commands.map(x => `\`${x}\``).join(" ") }]));
        await command.editReply({ embeds: [embed] });
    }

    async run(command: ChatInputCommandInteraction) {
        const groups = this.getAvailableGroups(command);

        const option = command.options.getString("command_name");

        if (!option) return await this.sendHelpMessage(command, groups);

        const commandObj = this.client.registry.findCommand(option);
        if (!commandObj) return await this.sendHelpMessage(command, groups);
        var isAvailable = false;

        groups.forEach(group => {
            if (group.commands.includes(commandObj.data.name)) isAvailable = true;
        });

        if (!isAvailable) return await this.sendHelpMessage(command, groups);

        const embed = new EmbedBuilder({
            color: Colors.Blue,
            title: "Help",
            fields: [
                {
                    name: "Name",
                    value: commandObj.data.name,
                },
                {
                    name: "Group",
                    value: commandObj.info.group,
                },
                {
                    name: "Cooldown",
                    value: commandObj.info.cooldown ? formatSeconds(commandObj.info.cooldown) : "No cooldown",
                },
                {
                    name: "Usable At",
                    value: commandObj.info.onlyNsfw ? "NSFW channels" : "All text channels",
                },
                {
                    name: "Example Usages",
                    value: commandObj.info.examples ? commandObj.info.examples.map(x => `\`${x}\``).join("\n") : "No examples",
                },
                {
                    name: "Description",
                    value: commandObj.data.description ? commandObj.data.description : "No description",
                },
            ],
        });

        if (commandObj.info.require) {
            if (commandObj.info.require.developer) embed.setFooter({ text: "This is a developer command." });
            if (commandObj.info.require.permissions)
                embed.addFields([{ name: "Permission Requirements", value: commandObj.info.require.permissions.map(x => `\`${x}\``).join("\n") }]);
        }

        await command.editReply({ embeds: [embed] });
    }
}
