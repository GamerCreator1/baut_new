import { ChatInputCommandInteraction, EmbedBuilder, Colors, ColorResolvable, SelectMenuBuilder, ActionRow, ActionRowBuilder, ComponentType, SelectMenuInteraction, Message, TextBasedChannel, DMChannel, PartialDMChannel } from "discord.js";

import Logger from "@classes/Logger";
import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class UserInfoCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "General",
                ephemeral: true
            },
            new SlashCommandBuilder()
                .setName("bookmark")
                .setDescription("Manage your bookmarks")
                .addSubcommand(subcommand => subcommand
                    .setName("list")
                    .setDescription("List your bookmarks"))
                .addSubcommand(subcommand => subcommand
                    .setName("delete")
                    .setDescription("Delete a bookmark")
                    .addNumberOption(option => option
                        .setName("id")
                        .setDescription("The id of the bookmark")
                        .setRequired(true)))
        );
    }

    private async list(command: ChatInputCommandInteraction) {
        const bookmarks = await this.client.db.bookmark.findMany({
            where: {
                userId: command.user.id
            }
        })
        const messages = await Promise.all(bookmarks.map(async (bookmark) => {
            const channel = await command.guild.channels.fetch(bookmark.channelId).catch(() => null);
            if (!channel.isTextBased()) {
                await this.client.db.bookmark.delete({
                    where: {
                        id: bookmark.id
                    }
                })
                return;
            };
            const message = await channel.messages.fetch(bookmark.messageID).catch(() => null);
            if (!message) {
                await this.client.db.bookmark.delete({
                    where: {
                        id: bookmark.id
                    }
                })
                return;
            };
            return Object.defineProperty(message, "bookmarkId", {
                value: bookmark.id
            })
        })) as (Message & { bookmarkId: string })[];

        // remove nulls
        const filteredMessages = messages.filter(message => !!message);

        if (filteredMessages.length === 0) {
            await command.editReply({ content: "You have no bookmarks. Use the context menu on a message to bookmark it." })
            return;
        }
        try {
            const selectMenu = new SelectMenuBuilder()
                .setOptions(filteredMessages.map((message) => ({
                    label: `${message.bookmarkId}: ` + ((message.channel as Exclude<TextBasedChannel, DMChannel | PartialDMChannel>).name + " - " + message.author.username).substring(0, 20),
                    value: message.bookmarkId.toString(),
                    description: message.content.substring(0, 50),
                })))
                .setCustomId("bookmark-list")
                .setPlaceholder("Select a bookmark")
            const response = await command.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("Select a bookmark to view it.")
                ], components: [new ActionRowBuilder<SelectMenuBuilder>().addComponents(selectMenu)]
            })

            const filter = (i: SelectMenuInteraction) => i.user == command.user && i.customId == "bookmark-list";
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, filter, time: 60000 })
            collector.on("collect", async (i: SelectMenuInteraction) => {
                const message = filteredMessages.find(message => message.bookmarkId == i.values[0]);
                const embed = new EmbedBuilder()
                    .setColor(process.env.BUILDERGROOP_COLOR as ColorResolvable)
                    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                    .setTitle(`Bookmark ${message.bookmarkId}`)
                    .setURL(message.url)
                    .setDescription(message.content)
                    .setTimestamp(message.createdAt)
                    .setFooter({ text: `ID: ${message.bookmarkId}` })
                await i.update({ embeds: [embed] })
            })

            collector.on("end", async () => {
                await response.edit({ content: "Session ended.", components: [] }).catch(() => null)
            })
        } catch (e) {
            Logger.log("ERROR", e.stack)
            await command.editReply({ content: "An error occurred, please try that again :)" })
        }
    }

    private async delete(command: ChatInputCommandInteraction) {
        const id = command.options.getNumber("id", true);
        const bookmark = await this.client.db.bookmark.findFirst({
            where: {
                id,
                userId: command.user.id
            }
        })
        if (!bookmark) {
            await command.editReply({ content: "Bookmark not found." })
            return;
        }
        const { messageID, channelId } = await this.client.db.bookmark.delete({
            where: {
                id
            }
        })
        await command.editReply({
            content: `Bookmark deleted. Here's a link in case you want to go back:
            https://discord.com/channels/${command.guild.id}/${channelId}/${messageID}`
        })
    }

    async run(command: ChatInputCommandInteraction) {
        switch (command.options.getSubcommand()) {
            case "list": {
                await this.list(command);
                break;
            }
            case "delete": {
                await this.delete(command);
                break;
            }
        }
    }
}
