import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Guild,
    GuildMember,
    PermissionFlagsBits,
    TextChannel,
    Colors,
    PermissionResolvable,
    PermissionsBitField,
} from "discord.js";

import { formatSeconds, getPermission, isUserDeveloper } from "@utils/functions";

import DiscordClient from "@structures/DiscordClient";

export default class CommandHandler {
    /**
     * Handles the commands.
     * @param command Message object
     */
    static async handleCommand(client: DiscordClient, command: ChatInputCommandInteraction) {
        const self = (command.guild as Guild).members.me as GuildMember;
        if (!self.permissions.has(PermissionFlagsBits.SendMessages)) return;
        if (!self.permissions.has(PermissionFlagsBits.Administrator))
            return await command.reply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "🚨 Missing Permission",
                        description: `${command.user.toString()}, bot requires \`ADMINISTRATOR\` permission to be run.`,
                    },
                ],
                ephemeral: true,
            });

        const cmd = client.registry.findCommand(command.commandName);
        if (!cmd) {
            if (client.config.unknownErrorMessage)
                await command.reply({
                    embeds: [
                        new EmbedBuilder().setTitle("🔎 Unknown Command").setDescription(`${command.user.toString()}, type \`/help\` to see the command list.`).setColor("#D1D1D1"),
                    ],
                    ephemeral: true,
                });
            return;
        }
        await command.deferReply({ ephemeral: cmd.info.ephemeral });

        if (cmd.info.enabled === false) return;
        if (cmd.info.onlyNsfw === true && !(command.channel as TextChannel).nsfw && !isUserDeveloper(client, command.user.id)) {
            await command.editReply({
                embeds: [
                    new EmbedBuilder().setTitle("🔞 Be Careful").setDescription(`${command.user.toString()}, you can't use this command on non-nsfw channels.`).setColor("#EEB4D5"),
                ],
            });
            return;
        }

        if (cmd.info.require) {
            if (cmd.info.require.developer && !isUserDeveloper(client, command.user.id)) {
                await command.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⚠️ Developer Only")
                            .setDescription(`${command.user.toString()}, you must be one of my developers to use this command!`)
                            .setColor("#EEB4D5"),
                    ],
                });
                return;
            }
            if (cmd.info.require.permissions && !isUserDeveloper(client, command.user.id)) {
                const perms: string[] = [];
                cmd.info.require.permissions.forEach(permission => {
                    if ((command.member as GuildMember).permissions.has(permission)) return;
                    else return perms.push(`\`${getPermission(permission)}\``);
                });
                if (perms.length)
                    return await command.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("⚠️ Missing Permissions")
                                .setDescription(`${command.user.toString()}, you must have these permissions to run this command.\n\n${perms.join("\n")}`)
                                .setColor("#EEB4D5"),
                        ],
                    });
            }
        }

        var addCooldown = false;

        const now = Date.now();
        const timestamps = client.registry.getCooldownTimestamps(cmd.data.name);
        const cooldownAmount = cmd.info.cooldown ? cmd.info.cooldown * 1000 : 0;
        if (cmd.info.cooldown) {
            if (timestamps.has(command.user.id)) {
                const currentTime = timestamps.get(command.user.id);
                if (!currentTime) return;

                const expirationTime = currentTime + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    return await command.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("⏰ Calm Down")
                                .setDescription(`${command.user.toString()}, you must wait \`${formatSeconds(Math.floor(timeLeft))}\` to run this command.`)
                                .setColor("#EEB4D5"),
                        ],
                    });
                }
            }

            addCooldown = true;
        }

        try {
            const user = command.user;
            var applyCooldown = true;
            await cmd.run(command);

            if (addCooldown && applyCooldown && !isUserDeveloper(client, user.id)) {
                timestamps.set(user.id, now);
                setTimeout(() => timestamps.delete(user.id), cooldownAmount);
            }
        } catch (error) {
            await cmd.onError(command, error instanceof Error ? error.stack : new Error(error).stack);
        }
    }

    /**
     * Handles autocomplete
     */
    static handleAutocomplete(client: DiscordClient, interaction: AutocompleteInteraction) {
        interaction.respond(client.registry.getAutocomplete().get(interaction.commandName)() ?? []);
    }
}
