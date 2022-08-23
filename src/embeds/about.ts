import { CacheType, Interaction, ActionRowBuilder, ButtonBuilder, Colors, EmbedBuilder, ButtonStyle } from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import { getChannelURL } from "@utils/functions";
import { bgTwitter } from "@utils/constants";

export default class AboutEmbed extends Embed {
    constructor() {
        super(
            "About",
            new EmbedBuilder({
                title: "Welcome to Buildergroop!",
                description: `We give curious teens the comradeship, resources, and recognition they need to kick-start their careers in tech or business. Whether you're just starting or super experienced - there's a place for you here.`,
                image: { url: "https://us-east-1.tixte.net/uploads/aaryaman.tixte.co/Frame_2.png" },
                color: Colors.Blurple,
            }),
            [],
            [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setLabel("Introduce Yourself").setURL(getChannelURL(process.env.INTRODUCTION_CHANNEL)).setStyle(ButtonStyle.Link),
                    new ButtonBuilder().setLabel("Select Roles").setURL(getChannelURL(process.env.ROLES_CHANNEL)).setStyle(ButtonStyle.Link),
                    new ButtonBuilder().setLabel("Read the Rules").setURL(getChannelURL(process.env.RULES_CHANNEL)).setStyle(ButtonStyle.Link),
                    new ButtonBuilder().setLabel("Find us on Twitter").setURL(bgTwitter).setStyle(ButtonStyle.Link)
                ),
            ]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {}
}
