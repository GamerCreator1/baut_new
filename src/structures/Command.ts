import { CommandInteraction, GuildMember, MessageEmbedOptions, TextChannel } from 'discord.js';

import Logger from '@classes/Logger';
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders';
import DiscordClient from '@structures/DiscordClient';
import { isUserDeveloper } from '@utils/functions';
import { ICommandInfo } from '@utils/interfaces';

export default abstract class Command {
    /**
     * Discord client.
     */
    readonly client: DiscordClient;

    /**
     * Information of the command.
     */
    readonly info: ICommandInfo;

    /**
     * Slash Command builder
     */
    readonly data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;

    constructor(client: DiscordClient, info: ICommandInfo, data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder) {
        this.client = client;
        this.info = info;
        this.data = data;
    }

    /**
     * Executes when command throws an error.
     * @param command Command Object
     * @param error Error message
     */
    async onError(command: CommandInteraction, error: any) {
        Logger.log('ERROR', `An error occurred in "${this.data.name}" command.\n${error}\n`, true);
        console.log(command)
        const embed =
            {
                color: 'RED',
                title: '💥 Oops...',
                description: `${command.user.toString()}, an error occurred while running this command. Please try again later.`
            } as MessageEmbedOptions;
        if (command.deferred) {
            command.editReply({ embeds: [embed] });
        }
        else {
            command.reply({ embeds: [embed] });
        }
    }

    /**
     * Returns usability of the command
     * @param command Message object
     * @param checkNsfw Checking nsfw channel
     */
    isUsable(command: CommandInteraction, checkNsfw: boolean = false): boolean {
        if (this.info.enabled === false) return false;
        if (checkNsfw && this.info.onlyNsfw === true && !(command.channel as TextChannel).nsfw && !isUserDeveloper(this.client, command.user.id)) return false;
        if (this.info.require) {
            if (this.info.require.developer && !isUserDeveloper(this.client, command.user.id)) return false;
            if (this.info.require.permissions && !isUserDeveloper(this.client, command.user.id)) {
                const perms: string[] = [];
                this.info.require.permissions.forEach(permission => {
                    if ((command.member as GuildMember).permissions.has(permission)) return;
                    else return perms.push(permission);
                });
                if (perms.length) return false;
            }
        }

        return true;
    }

    /**
     * Runs the command.
     * @param command Message object
     * @param args Arguments
     * @param cancelCooldown Cancels cooldown when function called
     */
    abstract run(command: CommandInteraction, cancelCooldown?: () => void): Promise<any>;
}
