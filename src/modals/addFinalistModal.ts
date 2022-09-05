import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export const addFinalistModal = new ModalBuilder()
    .setCustomId("finalist-add-modal")
    .setTitle("Add Finalist")
    .addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder().setLabel("Project Name").setStyle(TextInputStyle.Short).setCustomId("project-name").setMaxLength(256)
        ),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder().setLabel("Creator ID's").setStyle(TextInputStyle.Short).setCustomId("creator-ids").setMaxLength(256)
        ),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder().setLabel("Description").setStyle(TextInputStyle.Paragraph).setCustomId("description")
        ),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            // URL ORDER: github, devpost, live
            new TextInputBuilder().setLabel("URL's").setStyle(TextInputStyle.Paragraph).setCustomId("urls").setRequired(false).setRequired(false)
        ),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder().setLabel("Video").setStyle(TextInputStyle.Short).setCustomId("video").setRequired(false).setRequired(false)
        ),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder().setLabel("BannerURL").setStyle(TextInputStyle.Short).setCustomId("bannerURL").setRequired(false).setRequired(false)
        )
    );

export type addFinalistModalFieldsType = "project-name" | "creator-ids" | "description" | "urls" | "video" | "bannerURL";
