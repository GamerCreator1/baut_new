import { ChannelType, ColorResolvable, DMChannel, EmbedBuilder, Message, MessageType, TextChannel, ThreadChannel } from "discord.js";

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
        const expression =
            /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
        const urlFilter = new RegExp(expression);
        const url = urlFilter.exec(message.content);
        const link = url && url.length > 0 && url[0].length >= 4 ? new URL(url[0]) : null;
        if (message.channel.type == ChannelType.GuildText && message.guild.id == this.client.config.guildId) {
            await this.client.db.threadchannels.findMany().then(async threadChannels => {
                // @ts-ignore
                if (threadChannels.some(threadChannel => threadChannel.channel_id === message.channel.id)) {
                    const words = [];
                    if (link) {
                        message.content
                            .slice(0, 97)
                            .split(/\s+/)
                            .forEach(word => {
                                if (!urlFilter.test(word.toLowerCase().trim())) {
                                    words.push(word.trim());
                                }
                            });
                    }
                    let title;
                    if (words.length == 1) {
                        title = words[0];
                    } else if (words.join(" ").length > 97) {
                        title = words.slice(0, -1).join(" ") + "...";
                    } else {
                        title = words.join(" ");
                    }

                    if (title == "") title = `${(message.channel as TextChannel).name} - ${message.author.username}`;
                    await message.startThread({
                        name: title,
                        autoArchiveDuration: 1440,
                        reason: "[Baut AutoThread] Thread created for " + message.author.tag,
                    });
                    return;
                }
            });

            if (message.channel.id == process.env.INTRODUCTION_CHANNEL) {
                await message.member.roles.add(process.env.INTRODUCED_ROLE);
            }

            const discordMessageLinkExp = /https:\/\/discord.com\/channels\/\d+\/\d+\/\d+/;
            const discordMessageLink = discordMessageLinkExp.exec(message.content);
            if (discordMessageLink && discordMessageLink.length > 0) {
                const url = new URL(discordMessageLink[0]);
                const channelId = url.pathname.split("/")[3];
                const messageId = url.pathname.split("/")[4];
                const channel = await message.guild.channels.fetch(channelId);
                if (channel) {
                    const message = await (channel as TextChannel | DMChannel | ThreadChannel).messages.fetch(messageId);
                    if (message && message.type == MessageType.Default) {
                        const embed = new EmbedBuilder()
                            .setTitle("Message Link")
                            .setURL(message.url)
                            .setAuthor({
                                name: message.author.tag,
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setColor(process.env.BUILDERGROOP_COLOR as ColorResolvable)
                            .setDescription(message.content)
                            .setTimestamp(message.createdAt)
                            .setFooter({
                                text: `#${(channel as TextChannel).name}`
                            })
                            .setImage(message.attachments.first()?.url)
                        await message.channel.send({ embeds: [embed] });
                    }
                }
            }
        }
        if (link) {
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
