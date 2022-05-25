import { CommandInteraction, MessageEmbedOptions, TextBasedChannel } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';

import Logger from '../../classes/Logger';
import Command from '../../structures/Command';
import DiscordClient from '../../structures/DiscordClient';

export default class KickCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'Moderation',
                require: {
                    permissions: ['KICK_MEMBERS']
                }
            },
            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Manage server kicks.')
                .addUserOption(option => option.setName('user').setDescription('The user to kick').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the kick').setRequired(false))
        );
    }

    async run(command: CommandInteraction) {
        const user = command.options.getUser('user');
        const reason = command.options.getString('reason');
        const member = await command.guild.members.fetch(user);

        await member.kick(reason ?? `No reason provided by ${command.user.toString()}`);
        console.log(command);
        await command.editReply({
            embeds: [
                {
                    color: 'GREEN',
                    description: `${command.user.toString()}, ${member.toString()} has been kicked for: \`${reason}\`.`
                }
            ]
        });
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Members',
                enabled: true
            }
        });
        if (log) {
            const logChannel = member.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            if (logChannel) {
                const embed = {
                    author: { name: 'Members' },
                    color: 'DARK_PURPLE',
                    title: 'Member Kicked',
                    fields: [
                        {
                            name: 'Member',
                            value: member.user.toString(),
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                } as MessageEmbedOptions;
                await logChannel.send({
                    embeds: [embed]
                });
            }
        }
    }
}
