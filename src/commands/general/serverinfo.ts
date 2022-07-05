import { CommandInteraction, MessageEmbedOptions } from 'discord.js';

import Logger from '@classes/Logger';
import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '@structures/Command';
import DiscordClient from '@structures/DiscordClient';

export default class ServerInfoCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'General'
            },
            new SlashCommandBuilder().setName('serverinfo').setDescription('Returns some information about the current server.')
        );
    }

    async run(command: CommandInteraction) {
        const owner = await command.guild.fetchOwner();
        const embed = {
            color: process.env.BUILDERGROOP_COLOR,
            title: 'Server Information',
            fields: [
                {
                    name: 'Name',
                    value: command.guild.name,
                    inline: true
                },
                {
                    name: 'ID',
                    value: command.guild.id,
                    inline: true
                },
                {
                    name: 'Owner',
                    value: owner.toString() ?? 'N/A',
                    inline: true
                },
                {
                    name: 'Members',
                    value: command.guild.memberCount.toString(),
                    inline: true
                },
                {
                    name: 'Channels',
                    value: ` ${command.guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').size} 📁 / ${
                        command.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').size
                    } 💬 / ${command.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').size} 🔉`,
                    inline: true
                },
                {
                    name: 'Boost Status',
                    value: command.guild.premiumSubscriptionCount ? `${command.guild.premiumSubscriptionCount} boosts` : 'None',
                    inline: true
                },
                {
                    name: 'Roles',
                    value: command.guild.roles.cache.size.toString(),
                    inline: true
                },
                {
                    name: 'Emojis',
                    value: command.guild.emojis.cache.size.toString(),
                    inline: true
                },
                {
                    name: 'Created At',
                    value: `<t:${command.guild.createdAt.getTime().toString().substring(0, 10)}:f>`,
                    inline: true
                }
            ],
            thumbnail: {
                url: command.guild.iconURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
            }
        } as MessageEmbedOptions;
        // add banner if server has one
        if (command.guild.bannerURL()) embed.image = { url: command.guild.bannerURL() };
        await command.editReply({ embeds: [embed] });
    }
}
