import { ChatInputCommandInteraction, Colors } from "discord.js";

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
                    developer: true,
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
                        .addStringOption(option =>
                            option
                                .setName("time_zone")
                                .setChoices(
                                    {
                                        name: "PST",
                                        value: "PST",
                                    },
                                    {
                                        name: "EST",
                                        value: "EST",
                                    },
                                    {
                                        name: "IST",
                                        value: "IST",
                                    },
                                    {
                                        name: "CST (Central)",
                                        value: "UTC-5",
                                    },
                                    {
                                        name: "CST (China)",
                                        value: "UTC+8",
                                    },
                                    {
                                        name: "CEST",
                                        value: "CEST",
                                    },
                                    {
                                        name: "UTC+4",
                                        value: "UTC+4",
                                    },
                                    {
                                        name: "BST",
                                        value: "BST",
                                    },
                                    {
                                        name: "UTC+8",
                                        value: "UTC+8",
                                    },
                                    {
                                        name: "AEST",
                                        value: "AEST",
                                    }
                                )
                                .setDescription("The time zone of the auditor")
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("remove")
                        .setDescription("Remove an auditor")
                        .addUserOption(option => option.setName("user").setDescription("The user to remove as an auditor").setRequired(true))
                )
                .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all auditors"))
        );
        this.enabled = false;
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
        const zone = command.options.getString("time_zone");
        const startTime = DateTime.now().set({ hour: 6, minute: 0, second: 0, millisecond: 0 }).setZone(zone, { keepLocalTime: true });
        const endTime = DateTime.now().set({ hour: 20, minute: 0, second: 0, millisecond: 0 }).setZone(zone, { keepLocalTime: true });
        // every 15 minute slot from startTime to endTime
        const availSlots = Array.from({ length: Math.floor((endTime.diff(startTime).as("minutes") + 1) / 15) }, (_, i) => startTime.plus({ minutes: i * 15 })).map(time =>
            time.toISO()
        );
        await this.client.db.hacksAuditors.create({
            data: {
                userId: command.options.getUser("user")!.id,
                zone: command.options.getString("time_zone"),
                availSlots: availSlots,
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
