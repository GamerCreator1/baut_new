import { CacheType, Interaction, ActionRowBuilder, ButtonBuilder, Colors, EmbedBuilder, ButtonStyle } from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";

export default class ExampleEmbed extends Embed {
    constructor() {
        super(
            "Example",
            new EmbedBuilder({
                title: "Example Embed",
            }),
            ["test"],
            [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel("Test").setCustomId("test").setStyle(ButtonStyle.Primary))]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton()) {
            interaction.reply("Test");
        }
    }
}
