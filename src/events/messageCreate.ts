import { ChannelType, DMChannel, Message, ThreadChannel } from "discord.js";

import CommandHandler from "@classes/CommandHandler";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";
import { URL } from "url";

export default class MessageEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "messageCreate", false);
    }

    async run(message: Message) {
        if (message.author.bot || message.channel.type === ChannelType.DM) return;
        if (message.channel.type == ChannelType.GuildText && message.guild.id == this.client.config.guildId) {
            await this.client.db.threadchannels.findMany().then(async threadChannels => {
                // @ts-ignore
                if (threadChannels.some(threadChannel => threadChannel.channel_id === message.channel.id)) {
                    await message.startThread({
                        name: message.content == "" ? "???" : message.content.slice(0, 97).split(" ").slice(0, -1).join(" ") + "...", // make sure the message isn't too long without cutting off between words
                        autoArchiveDuration: 1440,
                        reason: "[Baut AutoThread] Thread created for " + message.author.tag,
                    });
                    return;
                }
            });

            if (message.channel.id == process.env.INTRODUCTION_CHANNEL) {
                await message.member.roles.add(process.env.INTRODUCED_ROLE);
            }
        }
        const expression =
            /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
        const urlFilter = new RegExp(expression);
        const url = urlFilter.exec(message.content);
        if (url && url.length > 0 && url[0].length >= 4) {
            const link = new URL(url[0]);
            const domainName = link.hostname;
            const isBlackListedChannel = await this.client.db.nolinkchannels.findFirst({
                where: {
                    channel_id: message.channel.id,
                },
            });
            if (isBlackListedChannel) {
                const isBlackListed = await this.client.db.blacklistedlinks.findFirst({
                    where: {
                        link: domainName,
                    },
                });
                if (isBlackListed) {
                    await message.delete();
                    return;
                }
            }
        }
    }
}
