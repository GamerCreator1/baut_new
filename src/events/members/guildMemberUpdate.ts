import { GuildMember, TextBasedChannel, Colors, EmbedData, EmbedBuilder, ChannelType } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class GuildMemberUpdateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "guildMemberUpdate", "Members");
    }

    async run(oldMember: GuildMember, newMember: GuildMember) {
        console.log("update");
        const embed = {
            title: "Member Updated",
            color: Colors.DarkPurple,
            fields: [
                {
                    name: "Member",
                    value: newMember.user.toString(),
                    inline: true,
                },
            ],
        } as EmbedData;
        if (oldMember.displayName !== newMember.displayName) {
            embed.fields.push({
                name: "Name",
                value: `${oldMember.displayName} -> ${newMember.displayName}`,
                inline: true,
            });
        }
        if (oldMember.permissions !== newMember.permissions) {
            // Determine whether permissions were added or removed
            const addedPermissions = newMember.permissions.toArray().filter(permission => !oldMember.permissions.has(permission));
            const removedPermissions = oldMember.permissions.toArray().filter(permission => !newMember.permissions.has(permission));
            if (addedPermissions.length > 0) {
                embed.fields.push({
                    name: "Added Permissions",
                    value: addedPermissions.join(", "),
                    inline: true,
                });
            }
            if (removedPermissions.length > 0) {
                embed.fields.push({
                    name: "Removed Permissions",
                    value: removedPermissions.join(", "),
                    inline: true,
                });
            }
        }
        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            // Determine whether roles were added or removed
            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
            if (addedRoles.size > 0) {
                embed.fields.push({
                    name: "Added Roles",
                    value: [...addedRoles.values()].map(role => role.toString()).join(", "),
                    inline: true,
                });
            }
            if (removedRoles.size > 0) {
                embed.fields.push({
                    name: "Removed Roles",
                    value: [...removedRoles.values()].map(role => role.toString()).join(", "),
                    inline: true,
                });
            }
        }
        console.log("CHANNEL", newMember.voice.channel);
        if (oldMember.voice.channelId !== newMember.voice.channelId && newMember.voice.channel) {
            const queue = await this.client.db.auditChannels.findMany({
                where: {
                    channel: newMember.voice.channelId,
                    queue: true,
                },
            });
            console.log(queue);
            if (queue) {
                console.log("queue");
                const auditorsChannel = await newMember.guild.channels.fetch(process.env.AUDITORS_CHANNEL);
                if (!auditorsChannel || auditorsChannel.type != ChannelType.GuildText) {
                    Logger.log("ERROR", "Failed to get auditors channel");
                    return;
                }
                const auditChannels = await this.client.db.auditChannels.findMany();
                type AuditVoice = typeof auditChannels[0] & { available: boolean };
                const voiceChannels = [] as AuditVoice[];
                for (let auditChannel of auditChannels) {
                    const channel = await newMember.guild.channels.fetch(auditChannel.channel, { force: true });
                    if (!channel || channel.type != ChannelType.GuildVoice) {
                        continue;
                    }
                    if (auditChannel.queue) {
                        voiceChannels.push({
                            ...auditChannel,
                            available: true,
                        });
                        continue;
                    }

                    voiceChannels.push({
                        ...auditChannel,
                        available: channel.members.size == 1 && channel.members.has(auditChannel.auditor),
                    });
                }
                let pings = "";
                for (let voiceChannel of voiceChannels) {
                    if (voiceChannel.available) {
                        pings += `<@${voiceChannel.auditor}> `;
                    }
                }
                await auditorsChannel.send(`${pings}\n${newMember.user.toString()} is in the queue!`);
            }
        }
        if (embed.fields.length > 0) {
            Logger.logEvent(this.client, newMember.guild, "Members", new EmbedBuilder(embed));
        }
    }
}
