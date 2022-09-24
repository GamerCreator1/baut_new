import { ChannelType, ColorResolvable, DMChannel, EmbedBuilder, Message, MessageType, PermissionFlagsBits, TextChannel, ThreadChannel } from "discord.js";

import CommandHandler from "@classes/CommandHandler";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";
import { URL } from "url";

export default class MessageEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "messageCreate", false);
    }

    async handleGuildMessage(message: Message, link: URL, urlFilter: RegExp) {
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
        if (link && link.hostname.endsWith("discord.com") && link.pathname.startsWith("/channels")) {
            const channelId = link.pathname.split("/")[3];
            const messageId = link.pathname.split("/")[4];
            const channel = await message.guild.channels.fetch(channelId);
            if (channel) {
                const linkedMsg = await (channel as TextChannel | DMChannel | ThreadChannel).messages.fetch(messageId);
                const validMessageTypes = [MessageType.Default, MessageType.Reply, MessageType.ThreadStarterMessage]
                console.log(linkedMsg.type)
                if (linkedMsg && validMessageTypes.includes(linkedMsg.type)) {
                    const embed = new EmbedBuilder()
                        .setTitle("Message Link")
                        .setURL(linkedMsg.url)
                        .setAuthor({
                            name: linkedMsg.author.tag,
                            iconURL: linkedMsg.author.displayAvatarURL()
                        })
                        .setColor(process.env.BUILDERGROOP_COLOR as ColorResolvable)
                        .setDescription(linkedMsg.content)
                        .setTimestamp(linkedMsg.createdAt)
                        .setFooter({
                            text: `#${(channel as TextChannel).name}`
                        })
                        .setImage(linkedMsg.attachments.first()?.url)
                    await message.channel.send({ embeds: [embed] });
                }
            }
        }
    }

    async handleLinks(message: Message, link: URL, urlFilter: RegExp) {
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

    async handleActivity(message: Message) {
        const user = await this.client.db.member.findFirst({
            where: {
                userId: message.author.id,
            }
        })
        if (!user) {
            await this.client.db.member.create({
                data: {
                    userId: message.author.id,
                    messages: [new Date(message.createdTimestamp).toISOString()]
                }
            })
        }
        else {
            user.messages.filter(msg => new Date(msg).getTime() > new Date().getTime() - 48 * 60 * 60 * 60 * 1000)
            user.messages.push(new Date(message.createdTimestamp).toISOString())
            await this.client.db.member.update({
                where: {
                    userId: message.author.id
                },
                data: {
                    messages: user.messages
                }
            })
            const { value } = await this.client.db.settings.findUnique({
                where: {
                    name: "activity_threshold"
                }
            })
            if (value && user.messages.length >= parseInt(value)) {
                const { value: roleId } = await this.client.db.settings.findUnique({
                    where: {
                        name: "activity_role"
                    }
                })
                if (roleId) {
                    const role = await message.guild.roles.fetch(roleId);
                    if (role) {
                        await message.member.roles.add(role);
                    }
                    else {
                        await this.client.db.settings.delete({
                            where: {
                                name: "activity_role"
                            }
                        })
                    }
                }
            }
        }
    }

    async run(message: Message) {
        if (message.author.bot || message.channel.type === ChannelType.DM) return;
        const expression =
            /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
        const urlFilter = new RegExp(expression);
        const url = urlFilter.exec(message.content);
        const link = url && url.length > 0 && url[0].length >= 4 ? new URL(url[0]) : null;
        if (message.channel.type == ChannelType.GuildText && message.guild.id == this.client.config.guildId) {
            await this.handleGuildMessage(message, link, urlFilter)
            await this.handleActivity(message)
        }
        if (link) {
            await this.handleLinks(message, link, urlFilter)
        }

    }
}
