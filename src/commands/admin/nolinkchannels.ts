import { ChatInputCommandInteraction, Colors } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";

export default class NoLinkChannelsCommand extends Command {
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
                .setName("no_link_channels")
                .setDescription("Alter no-link channels channels")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("add")
                        .setDescription("Add a no-link channel")
                        .addChannelOption(option => option.setName("channel").setDescription("The channel to add").setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("remove")
                        .setDescription("Remove a no-link channel")
                        .addChannelOption(option => option.setName("channel").setDescription("The channel to remove").setRequired(true))
                )
                .addSubcommand(subcommand => subcommand.setName("list").setDescription("List all no-link channels"))
        );
    }

    private async addNoLinkchannel(command: ChatInputCommandInteraction) {
        await this.client.db.nolinkchannels.create({
            data: {
                channel_id: command.options.getChannel("channel")!.id,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Added no-link channel ${command.options.getChannel("channel")!.toString()}`,
                },
            ],
        });
    }

    private async removeNoLinkchannel(command: ChatInputCommandInteraction) {
        await this.client.db.nolinkchannels.deleteMany({
            where: {
                channel_id: command.options.getChannel("channel")!.id,
            },
        });
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "✅ Success",
                    description: `Removed no-link channel ${command.options.getChannel("channel")!.toString()}`,
                },
            ],
        });
    }

    private async listNoLinkchannels(command: ChatInputCommandInteraction) {
        const noLinkChannels = await this.client.db.nolinkchannels.findMany({
            select: {
                channel_id: true,
            },
        });
        if (!noLinkChannels)
            return command.editReply({
                embeds: [
                    {
                        color: Colors.Red,
                        title: "❌ Error",
                        description: "Failed to get no-link channels",
                    },
                ],
            });
        const channels = noLinkChannels.map(noLinkChannel => this.client.channels.cache.get(noLinkChannel.channel_id));
        return command.editReply({
            embeds: [
                {
                    color: Colors.Green,
                    title: "📁 Thread Channels",
                    description: channels.length > 0 ? channels.map(channel => channel?.toString()).join("\n") : "No no-link channels",
                },
            ],
        });
    }

    async run(command: ChatInputCommandInteraction) {
        switch (command.options.getSubcommand()) {
            case "add":
                await this.addNoLinkchannel(command);
                break;
            case "remove":
                await this.removeNoLinkchannel(command);
                break;
            case "list":
                await this.listNoLinkchannels(command);
                break;
        }
    }
}
