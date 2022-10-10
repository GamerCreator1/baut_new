import { Message, TextBasedChannel, Colors, EmbedBuilder } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class MessageUpdateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "messageUpdate", "Messages");
    }

    async run(oldMessage: Message, newMessage: Message) {
        if (oldMessage.author.bot) return;
        const embed = {
            author: { name: "Messages" },
            title: "Message Updated",
            color: Colors.DarkPurple,
            fields: [],
            timestamp: new Date(),
            footer: {
                text: "Author ID: " + newMessage.author.id,
            },
        };
        if (oldMessage.content !== newMessage.content) {
            embed.fields.push({
                name: "Old Content",
                value: oldMessage.content || "`No content`",
                inline: false,
            });
            embed.fields.push({
                name: "New Content",
                value: newMessage.content || "`No content`",
                inline: false,
            });
        }
        if (oldMessage.attachments.size !== newMessage.attachments.size) {
            embed.fields.push({
                name: "Old Attachments",
                value:
                    oldMessage.attachments.size > 0
                        ? oldMessage.attachments
                              .mapValues(value => value.url)
                              .toJSON()
                              .join("\n")
                        : "None",
                inline: true,
            });
            embed.fields.push({
                name: "New Attachments",
                value:
                    newMessage.attachments.size > 0
                        ? newMessage.attachments
                              .mapValues(value => value.url)
                              .toJSON()
                              .join("\n")
                        : "None",
                inline: true,
            });
        }
        embed.fields.push(
            {
                name: "Author",
                value: newMessage.author.toString(),
                inline: true,
            },
            {
                name: "Channel",
                value: newMessage.channel.toString(),
                inline: false,
            }
        );
        Logger.logEvent(this.client, newMessage.guild, "Messages", new EmbedBuilder(embed));
    }
}
