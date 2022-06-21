import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import { Interaction, CacheType, MessageActionRow, MessageButton } from "discord.js";

export default class ExampleEmbed extends Embed {
    constructor() {
        super("Example", {
            title: "Example Embed",
        },
            ['test'], [
            new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel("Test")
                        .setCustomId("test")
                        .setStyle('PRIMARY')
                )
        ]);
    }

    onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): void {
        if (interaction.isButton()) {
            interaction.reply("Test");
        }
    }
}
