import { ChatInputCommandInteraction, Colors, PermissionsBitField } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import { DateTime } from "luxon";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class AuditorsCommand extends Command {
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
                .setName("auditors")
                .setDescription("Manage auditors")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("add")
                        .setDescription("Add an auditor")
                        .addUserOption(option => option.setName("user").setDescription("The user to add as an auditor").setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("remove")
                        .setDescription("Remove an auditor")
                        .addUserOption(option => option.setName("user").setDescription("The user to remove as an auditor").setRequired(true))
                )
                .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all auditors"))
        );
    }

    private async addAuditor(command: ChatInputCommandInteraction) {
        if ((await this.client.db.hacksAuditors.findMany({ where: { userId: command.options.getUser("user")!.id } })).length > 0) {
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "User is already an auditor",
                    },
                ],
            });
        }
        await this.client.db.hacksAuditors.create({
            data: {
                userId: command.options.getUser("user")!.id,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Added auditor ${command.options.getUser("user")!.toString()}`,
                },
            ],
        });
    }

    private async removeAuditor(command: ChatInputCommandInteraction) {
        await this.client.db.hacksAuditors.deleteMany({
            where: {
                userId: command.options.getUser("user")!.id,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Removed auditor ${command.options.getUser("user")!.toString()}`,
                },
            ],
        });
    }

    private async listAuditors(command: ChatInputCommandInteraction) {
        const auditors = await this.client.db.hacksAuditors.findMany({});
        if (!auditors)
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Failed to get auditors",
                    },
                ],
            });
        const users = auditors.map(a => `<@${a.userId}>`);
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "📁 Auditors",
                    description: users.length > 0 ? users.join("\n") : "No auditors",
                },
            ],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        switch (command.options.getSubcommand()) {
            case "add":
                await this.addAuditor(command);
                break;
            case "remove":
                await this.removeAuditor(command);
                break;
            case "list":
                await this.listAuditors(command);
                break;
        }
    }
}
