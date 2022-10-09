import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, PermissionsBitField, SelectMenuBuilder } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";
import ReactionRoles from "../../../reactionRoles.json";

export default class SayCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "Admin",
                require: {
                    permissions: [PermissionsBitField.Flags.ManageGuild],
                },
                ephemeral: true,
            },
            new SlashCommandBuilder().setName("roles").setDescription("Create role embed.")
        );
    }

    async run(command: ChatInputCommandInteraction) {
        ReactionRoles.map(role => {
            const selectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                new SelectMenuBuilder()
                    .addOptions(
                        role.options.map(option => ({
                            label: option.name,
                            emoji: option.emoji,
                            value: option.role,
                        }))
                    )
                    .setMaxValues(role.max)
                    .setMinValues(role.min ?? 0)
                    .setCustomId("roles/option/" + role.customId));
            command.channel.send({
                content: role.embed.description,
                options: {
                    username: command.user.username,
                },
                components: [selectMenu],
            });
        })
    }
}
