import { ChannelType, ThreadAutoArchiveDuration } from "discord-api-types/v10";
import {
    ButtonInteraction,
    CacheType,
    Collection,
    Interaction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
    Modal,
    ModalActionRowComponent,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    TextChannel,
    TextInputComponent,
    Webhook,
    WebhookClient,
} from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import { ShowcaseItem } from "@utils/interfaces";

export default class ShowcaseEmbed extends Embed {
    private static sessions: Collection<string, string> = new Collection();
    private static cooldowns: Collection<string, Date> = new Collection();
    private cancelled = false;

    constructor() {
        super(
            "Showcase",
            {
                title: "BuilderGroop Showcase 🎖",
                description: "Press the button below to create a new showcase item.",
            },
            ["create-showcase", "showcase/"],
            [new MessageActionRow().addComponents(new MessageButton().setLabel("Create").setCustomId("create-showcase").setStyle("PRIMARY"))]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton() && interaction.customId == "create-showcase") {
            const showcaseChannel = interaction.channel;

            if (showcaseChannel.isText()) {
                if (ShowcaseEmbed.sessions.has(interaction.user.id)) {
                    interaction.reply({ content: `You already have a showcase session open. View it at <#${ShowcaseEmbed.sessions.get(interaction.user.id)}>`, ephemeral: true });
                    return;
                } else if (ShowcaseEmbed.cooldowns.has(interaction.user.id)) {
                    const cooldown = ShowcaseEmbed.cooldowns.get(interaction.user.id);
                    const timeLeft = cooldown.getTime() - Date.now();
                    interaction.reply({ content: `You must wait ${Math.floor(timeLeft / 60000)} minutes before creating another achievement.`, ephemeral: true });
                    return;
                }

                const thread = await (showcaseChannel as TextChannel).threads.create({
                    name: "Create Showcase Item",
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                    reason: `${interaction.user.tag} started creating a new showcase item`,
                    type: client.config.prod ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
                });
                ShowcaseEmbed.sessions.set(interaction.user.id, thread.id);
                await interaction.reply({
                    content: `Started a process to create a showcase item at ${thread.toString()}`,
                    ephemeral: true,
                });

                let showcaseItem = {} as ShowcaseItem;

                const initMessage = await thread.send({
                    content: interaction.user.toString(),
                    embeds: [{ description: `Send a message containing the **title** of your Showcase submission. Press the red button below to cancel at any time.` }],
                    components: [new MessageActionRow().addComponents(new MessageButton().setLabel("Cancel").setStyle("DANGER").setCustomId("cancel"))],
                });

                const cancelFilter = (i: ButtonInteraction) => i.customId == "cancel" && i.user.id == interaction.user.id;
                const msgFilter = (m: Message) => m.author.id == interaction.user.id;
                const cancelCollector = initMessage.createMessageComponentCollector({ filter: cancelFilter, max: 1 }).on("collect", async () => {
                    await interaction.editReply({ content: "Cancelled creation of a showcase item." });
                    ShowcaseEmbed.sessions.delete(interaction.user.id);
                    thread.delete();
                    this.cancelled = true;
                });
                if (this.cancelled) return;

                await thread
                    .awaitMessages({ filter: msgFilter, time: 60000, errors: ["threadDelete"], maxProcessed: 1 })
                    .then(async collected => {
                        showcaseItem.title = collected.first().content;
                        await thread.send({
                            embeds: [{ description: "Next, send a brief **description** of your Showcase submission." }],
                        });
                    })
                    .catch(async e => {
                        if (this.cancelled) {
                            await interaction.editReply({ content: "Cancelled creation of a showcase item." });
                        } else {
                            await interaction.editReply({ content: "Timed out waiting for a response." });
                            await thread.delete();
                        }
                    });

                if (this.cancelled) return;

                await thread
                    .awaitMessages({ filter: msgFilter, time: 60000, errors: ["threadDelete"], maxProcessed: 1 })
                    .then(async collected => {
                        showcaseItem.description = collected.first().content;
                        await thread.send({
                            embeds: [{ description: "Next, send any **links** related to your Showcase submission, separated by commas(`link1,link2`), or `none` to skip." }],
                        });
                    })
                    .catch(async e => {
                        if (this.cancelled) {
                            await interaction.editReply({ content: "Cancelled creation of a showcase item." });
                        } else {
                            await interaction.editReply({ content: "Timed out waiting for a response." });
                            await thread.delete();
                        }
                    });

                if (this.cancelled) return;

                await thread
                    .awaitMessages({ filter: msgFilter, time: 60000, errors: ["threadDelete"], maxProcessed: 1 })
                    .then(async collected => {
                        if (collected.first().content.toLowerCase() != "none") {
                            showcaseItem.urls = collected
                                .first()
                                .content.split(",")
                                .map(l => l.trim());
                        } else {
                            showcaseItem.urls = [];
                        }

                        await thread.send({
                            embeds: [{ description: "Now, select the type of your showcase submission." }],
                            components: [
                                new MessageActionRow().addComponents(
                                    new MessageSelectMenu()
                                        .setPlaceholder("Select a Type")
                                        .setCustomId("type")
                                        .setMaxValues(1)
                                        .setOptions(
                                            { label: "Startup", value: "Startup" },
                                            { label: "Project", value: "Project" },
                                            { label: "Community", value: "Community" },
                                            { label: "Article", value: "Article" },
                                            { label: "Design", value: "Design" },
                                            { label: "Tweet", value: "Tweet" },
                                            { label: "Open-Source", value: "Open-Source" }
                                        )
                                ),
                            ],
                        });
                    })
                    .catch(async e => {
                        if (this.cancelled) {
                            await interaction.editReply({ content: "Cancelled creation of a showcase item." });
                        } else {
                            Logger.log("ERROR", e.stack);
                            await interaction.editReply({ content: "Timed out waiting for a response." });
                            await thread.delete();
                        }
                    });

                const typeFilter = (i: SelectMenuInteraction) => i.user.id == interaction.user.id && i.customId == "type";
                const parsed = parseURLArray(showcaseItem.urls);
                if (this.cancelled) return;

                await thread
                    .awaitMessageComponent({ componentType: "SELECT_MENU", filter: typeFilter, time: 60000 })
                    .then(async (select: SelectMenuInteraction) => {
                        showcaseItem.type = select.values[0] as ShowcaseItem["type"];
                        await select.reply({
                            embeds: [{ description: "Now, send a message with any files or media you want to include, or `none` to skip" }],
                        });
                    })
                    .catch(e => {
                        if (!this.cancelled) {
                            thread.delete("Session timed out");
                            interaction.editReply({ content: "Session timed out" });
                        } else {
                            interaction.editReply({ content: "Cancelled." });
                        }
                    });

                const mediaFilter = (m: Message) => {
                    return m.author.id == interaction.user.id && (m.attachments.size > 0 || m.content.toLowerCase() == "none");
                };
                if (this.cancelled) return;

                await thread
                    .awaitMessages({ filter: mediaFilter, time: 60000, maxProcessed: 1, errors: ["threadDelete"] })
                    .then(async collected => {
                        const media = collected.first();
                        if (media) {
                            showcaseItem.media = media.attachments.map(a => a.url);
                            await thread.send({
                                content: "Lastly, send a message pinging any users you worked on this with, or `none` to skip.",
                            });
                        }
                    })
                    .catch(e => {
                        if (!this.cancelled) {
                            thread.delete("Session timed out");
                            interaction.editReply({ content: "Session timed out" });
                        } else {
                            interaction.editReply({ content: "Cancelled." });
                        }
                    });

                const userMentionFilter = (m: Message) => m.author.id == interaction.user.id && m.mentions.users.size > 0;
                if (this.cancelled) return;

                await thread
                    .awaitMessages({ filter: userMentionFilter, time: 60000, maxProcessed: 1, errors: ["threadDelete"] })
                    .then(async collected => {
                        const userMentions = collected.first();
                        if (userMentions) {
                            showcaseItem.collaboratorIds = userMentions.mentions.users.map(u => u.id);
                            await thread.send({
                                content: "Creating your embed now...",
                                embeds: [
                                    {
                                        author: { name: showcaseItem.type.toString() },
                                        title: showcaseItem.title,
                                        description:
                                            showcaseItem.description +
                                            `\n
                                            **Collaborators**:
                                            ${showcaseItem.collaboratorIds.map(u => `<@${u}>`).join("\n")}
                                            `,
                                        fields: [
                                            {
                                                name: "URLs",
                                                value: parsed.length > 0 ? parsed.join("\n") : "No URLs provided",
                                            },
                                        ],
                                        color: fetchColorFromType(showcaseItem.type),
                                    },
                                ],
                                files: showcaseItem.media,
                            });
                        }
                    })
                    .catch(e => {
                        if (!this.cancelled) {
                            thread.delete("Session timed out");
                            interaction.editReply({ content: "Session timed out" });
                        } else {
                            interaction.editReply({ content: "Cancelled." });
                        }
                    });

                const item = await client.db.showcaseItem.create({
                    data: {
                        ...showcaseItem,
                        creatorId: interaction.user.id,
                        createdAt: new Date(),
                        upvoteCount: 0,
                        downvoteCount: 0,
                        upvoterIds: [],
                        downvoterIds: [],
                        type: dbParseType(showcaseItem.type),
                    },
                });
                if (this.cancelled) return;

                await thread.send("Success!");
                ShowcaseEmbed.sessions.delete(interaction.user.id);
                await thread.delete(`Created showcase item ${item.id}`);
                ShowcaseEmbed.cooldowns.set(interaction.user.id, new Date(Date.now() + 60 * 30 * 1000));

                setTimeout(() => ShowcaseEmbed.cooldowns.delete(interaction.user.id), 60 * 30 * 1000);
                cancelCollector.stop();

                console.log(interaction.user);

                const webhook = new WebhookClient({ url: process.env.SHOWCASE_WEBHOOK });

                // TODO: put in showcase item type
                const showcaseMessage = await webhook.send({
                    embeds: [
                        {
                            title: showcaseItem.title,
                            description:
                                showcaseItem.description +
                                `\n
                                **Collaborators**:
                                ${showcaseItem.collaboratorIds?.map(u => `<@${u}>`).join("\n") ?? "None"}
                                `,
                            color: fetchColorFromType(showcaseItem.type),
                            fields: [
                                {
                                    name: "URLs",
                                    value: parsed.length > 0 ? parsed.join("\n") : "No URLs provided",
                                },
                            ],
                            footer: { text: "0 Upvotes" },
                            timestamp: new Date(),
                        },
                    ],
                    files: showcaseItem.media,
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setLabel("Upvote").setStyle("SUCCESS").setEmoji("👍").setCustomId(`showcase/upvote/${item.id}`),
                            new MessageButton().setLabel("Downvote").setStyle("DANGER").setEmoji("👎").setCustomId(`showcase/downvote/${item.id}`),
                            new MessageButton().setLabel("Clear Vote").setStyle("SECONDARY").setEmoji("❌").setCustomId(`showcase/clear/${item.id}`),
                            new MessageButton().setLabel("Open").setStyle("LINK").setURL("https://buildergroop.com")
                        ),
                    ],
                });

                const sendEmbed = client.registry.getEmbeds().find(e => e.id === this.id);
                await interaction.channel.send({ embeds: [sendEmbed.embed], components: sendEmbed.components });

                // TODO: delete old embed

                // await showcaseMessage.startThread({
                //     name: showcaseItem.title,
                //     reason: "Showcase item",
                //     autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                // });
            }

            return;
        }

        if (interaction.isButton() && interaction.customId.startsWith("showcase/")) {
            const showcaseMessage = interaction.message as Message<boolean>;
            const id = parseInt(interaction.customId.split("/")[2]);
            const userId = interaction.user.id;
            const action = interaction.customId.split("/")[1];

            const item = await prisma.showcaseItem.findFirst({
                where: { id },
                include: { downvotes: true },
            });
            const initialCount = item.upvoteCount - item.downvoteCount;

            if (!item) return;

            switch (action) {
                case "upvote":
                    if (!item.upvoterIds.includes(userId)) {
                        item.upvoterIds.push(userId);
                        item.upvoteCount++;

                        if (item.downvoterIds.includes(userId)) {
                            item.downvoterIds.splice(item.downvoterIds.indexOf(userId), 1);
                            item.downvotes = item.downvotes.filter(i => i.downvoterId == userId);
                            item.downvoteCount--;

                            await interaction.reply({ content: "Removed your downvote and added an upvote.", ephemeral: true });
                            break;
                        }

                        await interaction.reply({ content: "Upvoted!", ephemeral: true });
                        break;
                    } else {
                        item.upvoterIds.splice(item.upvoterIds.indexOf(userId), 1);
                        item.upvoteCount--;

                        await interaction.reply({ content: "Removed your upvote.", ephemeral: true });
                        break;
                    }
                case "downvote":
                    if (!item.downvoterIds.includes(userId)) {
                        const reasonModal = new Modal()
                            .setTitle(`Downvote ${item.type}`)
                            .setCustomId("downvote-reason")
                            .setComponents(
                                new MessageActionRow<ModalActionRowComponent>().addComponents(
                                    new TextInputComponent()
                                        .setCustomId("downvote-reason-input")
                                        .setLabel("reason")
                                        .setStyle("PARAGRAPH")
                                        .setPlaceholder(`In order to downvote this ${item.type}, Give the creator of this showcase some constructive criticism.`)
                                        .setMinLength(1)
                                        .setRequired(true)
                                )
                            );

                        await interaction.showModal(reasonModal);

                        const modalFilter = (interaction: Interaction) => interaction.isModalSubmit() && interaction.customId == "downvote-reason";

                        await interaction.awaitModalSubmit({ filter: modalFilter, time: 60000 }).then(async (i: ModalSubmitInteraction) => {
                            const reason = i.fields.getTextInputValue("downvote-reason-input");

                            item.downvoterIds.push(userId);
                            item.downvotes.push({
                                downvoterId: userId,
                                reason,
                                showcaseItemId: id,
                            });
                            item.downvoteCount++;

                            if (item.upvoterIds.includes(userId)) {
                                item.upvoterIds.splice(item.upvoterIds.indexOf(userId), 1);
                                item.upvoteCount--;
                                await i.reply({ content: "Removed your upvote and added a downvote.", ephemeral: true });
                            } else {
                                await i.reply({ content: "Downvoted!", ephemeral: true });
                            }
                        });
                        break;
                    } else {
                        item.downvoterIds.splice(item.downvoterIds.indexOf(userId), 1);
                        item.downvoteCount--;

                        await interaction.reply({ content: "Removed your downvote.", ephemeral: true });
                        break;
                    }
                case "clear":
                    if (item.downvoterIds.includes(userId)) {
                        item.downvoterIds.splice(item.downvoterIds.indexOf(userId), 1);
                        item.downvoteCount--;
                        item.downvotes = item.downvotes.filter(i => i.downvoterId == userId);

                        await interaction.reply({ content: "Removed your downvote", ephemeral: true });
                        break;
                    } else if (item.upvoterIds.includes(userId)) {
                        item.upvoterIds.splice(item.upvoterIds.indexOf(userId), 1);
                        item.upvoteCount--;

                        await interaction.reply({ content: "Removed your upvote.", ephemeral: true });
                        break;
                    } else {
                        await interaction.reply({ content: "You have not voted on this item.", ephemeral: true });
                    }
                default:
                    break;
            }

            await prisma.showcaseItem.update({
                where: { id },
                data: {
                    upvoterIds: item.upvoterIds,
                    downvoterIds: item.downvoterIds,
                    upvoteCount: item.upvoteCount,
                    downvoteCount: item.downvoteCount,
                },
            });

            const count = item.upvoteCount - item.downvoteCount;
            if (count != initialCount) {
                await showcaseMessage.edit({
                    embeds: [showcaseMessage.embeds[0].setFooter({ text: `${count} ${count > 0 ? "🔺" : "🔻"}` })],
                });
            }

            return;
        }
    }
}

const parseURLArray = (urls: string[]) => {
    return urls.flatMap(u => {
        try {
            return [`[${new URL(u).hostname}](${u})`];
        } catch (e) {
            return [];
        }
    });
};

const fetchColorFromType = (type: ShowcaseItem["type"]) => {
    switch (type) {
        case "Startup":
            return "#23362b";
        case "Community":
            return "#1bb28c";
        case "Article":
            return "#e86a58";
        case "Design":
            return "#fed45b";
        case "Open-Source":
            return "#9bc7c5";
        case "Tweet":
            return "#efeeea";
        case "Project":
            return "#219ebc";
    }
};

const dbParseType = (type: ShowcaseItem["type"]) => {
    switch (type) {
        case "Startup":
            return "STARTUP";
        case "Community":
            return "COMMUNITY";
        case "Article":
            return "ARTICLE";
        case "Design":
            return "DESIGN";
        case "Open-Source":
            return "OPEN_SOURCE";
        case "Tweet":
            return "TWEET";
        case "Project":
            return "PROJECT";
    }
};
