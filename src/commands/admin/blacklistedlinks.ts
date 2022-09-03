import { ChatInputCommandInteraction, Colors, PermissionsBitField } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class BlacklistedLinksCommand extends Command {
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
                .setName("blacklisted_links")
                .setDescription("Alter blacklisted links")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("add")
                        .setDescription("Add a blacklisted link")
                        .addStringOption(option => option.setName("link").setDescription("The link to add").setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("remove")
                        .setDescription("Remove a blacklisted link")
                        .addStringOption(option => option.setName("link").setDescription("The link to remove").setRequired(true))
                )
                .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all blacklisted links"))
        );
    }

    private async addBlacklistedLink(command: ChatInputCommandInteraction) {
        const link = command.options.getString("link");
        const url = new URL(link);
        if (!url.hostname) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Invalid link",
                    },
                ],
            });
        }
        await this.client.db.blacklistedlinks.create({
            data: {
                link: url.hostname,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Added blacklisted link ${command.options.getString("link")}`,
                },
            ],
        });
    }

    private async removeBlacklistedLink(command: ChatInputCommandInteraction) {
        await this.client.db.blacklistedlinks.deleteMany({
            where: {
                link: command.options.getString("link"),
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Removed blacklisted link ${command.options.getString("link")}`,
                },
            ],
        });
    }

    private async listBlacklistedLinks(command: ChatInputCommandInteraction) {
        const blacklistedLinks = await this.client.db.blacklistedlinks.findMany({
            select: {
                link: true,
            },
        });
        if (!blacklistedLinks)
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Failed to get blacklisted links.",
                    },
                ],
            });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "📁 Thread Channels",
                    description: blacklistedLinks.length > 0 ? blacklistedLinks.map((link, i) => `${i + 1}. ${link.link}`).join("\n") : "No blacklisted links",
                },
            ],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        switch (command.options.getSubcommand()) {
            case "add":
                await this.addBlacklistedLink(command);
                break;
            case "remove":
                await this.removeBlacklistedLink(command);
                break;
            case "list":
                await this.listBlacklistedLinks(command);
                break;
        }
    }
}
