import { CacheType, Interaction, MessageActionRow, MessageButton } from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import { getChannelURL } from "@utils/functions";
import { bgTwitter } from "@utils/constants";

export default class AboutEmbed extends Embed {
    constructor() {
        super(
            "About",
            {
                title: "Welcome to Buildergroop!",
                description: `We give curious teens the comradeship, resources, and recognition they need to kick-start their careers in tech or business. Whether you're just starting or super experienced - there's a place for you here.`,
                // thumbnail: { url: "https://us-east-1.tixte.net/uploads/aaryaman.tixte.co/BuildergroopLogo.png", height: 1000, width: 500 },
                image: { url: "https://us-east-1.tixte.net/uploads/aaryaman.tixte.co/Frame_2.png" },
                color: "BLURPLE",
            },
            ["test"],
            [
                new MessageActionRow().addComponents(
                    new MessageButton().setLabel("Introduce Yourself").setCustomId("make-intro-button").setStyle("SUCCESS"),
                    new MessageButton().setLabel("Select Roles").setURL(getChannelURL(process.env.ROLES_CHANNEL)).setStyle("LINK"),
                    new MessageButton().setLabel("Read the Rules").setURL(getChannelURL(process.env.RULES_CHANNEL)).setStyle("LINK"),
                    new MessageButton().setLabel("Find us on Twitter").setURL(bgTwitter).setStyle("LINK")
                ),
            ]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton() && interaction.id === "make-intro-button") {
            // https://discord.com/channels/1000694607883030528/1003305137718169651
        }
    }
}
