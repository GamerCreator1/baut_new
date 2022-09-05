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

        // URL ORDER: banner, video
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder().setLabel("Media").setStyle(TextInputStyle.Short).setCustomId("media").setRequired(false).setRequired(false)
        )
    );

export type addFinalistModalFieldsType = "project-name" | "creator-ids" | "description" | "urls" | "media";
