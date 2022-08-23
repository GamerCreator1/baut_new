import { ChatInputCommandInteraction, TextBasedChannel, Colors, EmbedBuilder } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

import Logger from "@classes/Logger";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class ClearCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: "Moderation",
                require: {
                    permissions: ["MANAGE_MESSAGES"],
                },
            },
            new SlashCommandBuilder()
                .setName("clear")
                .setDescription("Clear messages from a channel.")
                .addNumberOption(option => option.setName("amount").setDescription("The amount of messages to delete").setRequired(true))
        );
    }

    async run(command: ChatInputCommandInteraction) {
        const amount = command.options.getNumber("amount");
        const channel = command.channel;
        const user = command.user;
        await command.deleteReply();
        const deleted = await channel.bulkDelete(amount, true);
        await channel.send({
            embeds: [
                {
                    color: Colors.Green,
                    description: `${user.toString()}, ${deleted.size} messages have been deleted.`,
                    footer: { text: "If I was unable to delete all the messages, it might be because some of them are more than 2 weeks old." },
                },
            ],
        });
        const embed = new EmbedBuilder()
            .setAuthor({ name: "Messages" })
            .setTitle("Messages Bulk Deleted")
            .setColor(Colors.DarkPurple)
            .setFields([
                {
                    name: "Channel",
                    value: channel.toString() ?? "N/A",
                    inline: true,
                },
                {
                    name: "Deleted By",
                    value: user.toString() ?? "N/A",
                    inline: true,
                },
                {
                    name: "Amount",
                    value: deleted.size.toString() ?? "N/A",
                    inline: true,
                },
            ])
            .setTimestamp(new Date());
        Logger.logEvent(this.client, command.guild, "Messages", embed);
    }
}
