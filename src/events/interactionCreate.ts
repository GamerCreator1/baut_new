import { Interaction, Colors, InteractionType, ChatInputCommandInteraction, ContextMenuCommandInteraction } from "discord.js";

import CommandHandler from "@classes/CommandHandler";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class InteractionEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "interactionCreate", false);
    }

    async run(interaction: Interaction) {
        if (interaction.isContextMenuCommand()) {
            const command = this.client.registry.findContextMenu(interaction.commandName);
            if (!command) return;
            await interaction.deferReply({ ephemeral: true });
            await command.onInteraction(interaction as ContextMenuCommandInteraction, this.client);
            return;
        } else if (interaction.isChatInputCommand()) return await CommandHandler.handleCommand(this.client, interaction as ChatInputCommandInteraction);
        else if (interaction.type == InteractionType.ApplicationCommandAutocomplete) return CommandHandler.handleAutocomplete(this.client, interaction);
        else if (interaction.type == InteractionType.MessageComponent) {
            const id = interaction.customId;
            this.client.registry.getEmbeds().forEach(async embed => {
                if (embed.interactionIds.some(i => id.startsWith(i))) {
                    try {
                        await embed.onInteraction(interaction, this.client);
                    } catch (e) {
                        await embed.onError(e);
                    }
                }
            });
        } else {
            await interaction.reply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "🚨 Unknown Interaction",
                        description:
                            "I'll be honest...I have no clue what you just tried to do. Might be because I don't support that interaction yet, or my bot developer, Neesh, screwed up.",
                    },
                ],
                ephemeral: true,
            });
        }
    }
}
