import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    ComponentType,
    Message,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    PermissionsBitField,
} from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";
import { addFinalistModal, addFinalistModalFieldsType } from "@modals/addFinalistModal";
import { HacksFinalist } from "@prisma/client";

export default class FinalistsCommand extends Command {
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
            new SlashCommandBuilder()
                .setName("finalists")
                .setDescription("Manage finalist projects.")
                .addSubcommand(subcommand => subcommand.setName("add").setDescription("Add a finalist project."))
                .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all finalist projects."))
        );
    }

    private async addFinalist(command: ChatInputCommandInteraction) {
        const button = new ButtonBuilder().setCustomId("finalist-add-button").setLabel(`Create New Finalist`).setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        const reply = (await command.editReply({
            content: "Click below to add a new finalist.",
            components: [row],
        })) as Message;

        const modalOpenFilter = (i: MessageComponentInteraction) => i.customId === "finalist-add-button" && i.user.id === command.user.id;

        // Wait for the button to be pressed
        await reply
            .awaitMessageComponent({ filter: modalOpenFilter, componentType: ComponentType.Button, time: 10000 })
            .then(async (interaction: MessageComponentInteraction) => {
                interaction.showModal(addFinalistModal);
                const modalSubmitFilter = (i: ModalSubmitInteraction) => i.customId === "finalist-add-modal" && i.user.id === command.user.id;

                // wait for modal to be submitted
                await interaction.awaitModalSubmit({ filter: modalSubmitFilter, time: 60000 }).then(async (modalSubmit: ModalSubmitInteraction) => {
                    const getInput = (input: addFinalistModalFieldsType) => modalSubmit.fields.getTextInputValue(input);

                    const creatorDiscordIds = getInput("creator-ids").split(",");
                    const urls = getInput("urls").split(",");
                    const media = getInput("media").split(",");

                    try {
                        await this.client.db.hacksFinalist.create({
                            data: {
                                projectName: getInput("project-name"),
                                description: getInput("description"),
                                creatorDiscordIds,
                                githubURL: urls[0],
                                devpostURL: urls[1] || "",
                                liveURL: urls[2] || "",
                                bannerURL: media[0] || "",
                                videoURL: media[1] || "",
                            },
                        });
                    } catch (e) {
                        console.error(e);
                    }
                });
            })
            .catch(() => command.editReply({ content: "Timed out." }));
    }

    private async listFinalists(command: ChatInputCommandInteraction) {
        const finalistProjects = await this.client.db.hacksFinalist.findMany();
        console.log(finalistProjects);
        for (let i = 0; i < finalistProjects.length; i++) {
            console.log(i);
            const project = finalistProjects[i];
            console.log(project);

            const voteButton = new ButtonBuilder().setCustomId(`finalists-vote/${project.id}`).setLabel(`Cast Your Vote`).setStyle(ButtonStyle.Primary);
            const githubButton = new ButtonBuilder().setLabel(`Github`).setStyle(ButtonStyle.Link).setURL(project.githubURL);
            const devpostButton = new ButtonBuilder().setLabel(`Devpost`).setStyle(ButtonStyle.Link);
            const videoButton = new ButtonBuilder().setLabel(`Presentation`).setStyle(ButtonStyle.Link);

            const buttons = [voteButton, githubButton];

            if (project.devpostURL) {
                devpostButton.setURL(project.devpostURL);
                buttons.push(devpostButton);
            }
            if (project.videoURL) {
                videoButton.setURL(project.videoURL);
                buttons.push(videoButton);
            }

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

            await command.channel.send({
                embeds: [
                    {
                        title: project.projectName,
                        description: project.description,
                        color: Colors.Blurple,
                        url: project.liveURL || undefined,
                        author: {
                            name: project.liveURL || "BuilderHacks S2 Finalist",
                            icon_url: "https://media.discordapp.net/attachments/913668807015407649/1016344619002384394/Buildergroop_Logo_Discord.png",
                        },
                        footer: {
                            text: "Your vote will remain anonymous.",
                        },
                        image: project.bannerURL && {
                            url: project.bannerURL,
                        },
                    },
                ],
                components: [row],
            });

            await command.channel.send("_ _");
        }

        await command.editReply("Sent Projects!");
    }

    async run(command: ChatInputCommandInteraction) {
        switch (command.options.getSubcommand()) {
            case "add":
                await this.addFinalist(command);
                break;
            case "list":
                await this.listFinalists(command);
                break;
        }
    }
}
