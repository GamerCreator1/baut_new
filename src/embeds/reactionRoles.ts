import {
    CacheType,
    GuildMember,
    Interaction,
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    SelectMenuBuilder,
    SelectMenuInteraction,
    Colors,
    EmbedBuilder,
    ButtonStyle,
    ComponentType,
} from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";

import ReactionRoles from "../../reactionRoles.json";

export default class ReactionRolesEmbed extends Embed {
    constructor() {
        super(
            "Reaction Roles",
            new EmbedBuilder({
                title: "Roles",
                image: {
                    url: "https://images-ext-1.discordapp.net/external/q-I6wm9ZetC7r9vpdjehTqOeTIWUn5CZ6sImEz3nsCc/https/i.ibb.co/yPLwMRJ/roles.png",
                },
            }),
            ["roles/option"],
            [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    ...ReactionRoles.map(role =>
                        new ButtonBuilder()
                            .setCustomId("roles/option/" + role.customId)
                            .setLabel(role.name)
                            .setEmoji(role.emoji || "")
                            .setStyle(ButtonStyle.Primary)
                    )
                ),
            ]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton()) {
            await interaction.deferReply({ ephemeral: true });
            const roleObj = ReactionRoles.find(role => "roles/option/" + role.customId === interaction.customId);
            const roleObjRoles = roleObj.options.map(r => r.role);
            const user = interaction.member as GuildMember;
            if (!roleObj) return;
            const embed = {
                title: roleObj.embed.title,
                description: roleObj.embed.description,
                footer: {
                    text: roleObj.type,
                },
            };
            const selectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                new SelectMenuBuilder()
                    .addOptions(
                        ...roleObj.options.map(option => ({
                            label: option.name,
                            emoji: option.emoji,
                            value: option.role,
                            default: user.roles.cache.has(option.role),
                        }))
                    )
                    .setMaxValues(roleObj.max)
                    .setMinValues(roleObj.min ?? 0)
                    .setCustomId("roles/selection/" + roleObj.customId)
            );
            const message = (await interaction.editReply({
                embeds: [embed],
                components: [selectMenu],
            })) as Message;

            const roleSelectorFilter = (i: SelectMenuInteraction) => {
                return i.user.id == user.id && i.customId.startsWith("roles/selection/");
            };
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 60000, filter: roleSelectorFilter });
            collector.on("collect", async (select: SelectMenuInteraction) => {
                await select.deferReply({ ephemeral: true });
                if (roleObj.type == "Multi Select") {
                    const options = select.values;
                    const removed = user.roles.cache.filter(role => !options.includes(role.id) && roleObjRoles.includes(role.id));
                    removed.forEach(async role => await user.roles.remove(role));
                    const added = options.filter(option => !user.roles.cache.has(option) && roleObjRoles.includes(option));
                    added.forEach(async role => await user.roles.add(role));

                    await select.editReply(`:heavy_minus_sign: ${removed.map(r => r.toString()).join(", ")}\n:heavy_plus_sign: <@&${added.map(r => r.toString()).join(">, <@&")}>`);
                } else {
                    let removed;
                    roleObj.options.forEach(async option => {
                        if (option.role == select.values[0]) {
                            await user.roles.add(option.role);
                        } else if (user.roles.cache.has(option.role)) {
                            removed = option.role;
                            await user.roles.remove(option.role);
                        }
                    });
                    if (removed) {
                        await select.editReply(`:heavy_minus_sign: ${removed}\n:heavy_plus_sign: ${select.values[0]}`);
                    } else {
                        await select.editReply(`:heavy_plus_sign: ${select.values[0]}`);
                    }
                }
            });
            collector.on("end", (collected: SelectMenuInteraction[], reason: string) => {
                selectMenu.components[0].setDisabled(true);
                interaction.editReply({
                    content: "Session ended.",
                    components: [selectMenu],
                });
            });
        }
    }
}
