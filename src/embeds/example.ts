import { CacheType, Interaction, MessageActionRow, MessageButton } from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";

export default class ExampleEmbed extends Embed {
    constructor() {
        super(
            "Example",
            {
                title: "Example Embed",
            },
            ["test"],
            [new MessageActionRow().addComponents(new MessageButton().setLabel("Test").setCustomId("test").setStyle("PRIMARY"))]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton()) {
            interaction.reply("Test");
        }
    }
}
