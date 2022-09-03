import { GuildMember, TextBasedChannel, Colors, EmbedData, EmbedBuilder, ChannelType, VoiceState } from "discord.js";

import Logger from "@classes/Logger";
import DiscordClient from "@structures/DiscordClient";
import Event from "@structures/Event";

export default class GuildMemberUpdateEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, "voiceStateUpdate", false);
    }

    async run(oldState: VoiceState, newState: VoiceState) {
        if (oldState.channelId !== newState.channelId && newState.channel) {
            const queue = await this.client.db.auditChannels.findMany({
                where: {
                    channel: newState.channelId,
                    queue: {
                        equals: true,
                    },
                },
            });
            if (queue) {
                const auditorsChannel = await newState.member.guild.channels.fetch(process.env.AUDITORS_CHANNEL);
                if (!auditorsChannel || auditorsChannel.type != ChannelType.GuildText) {
                    Logger.log("ERROR", "Failed to get auditors channel");
                    return;
                }
                const auditChannels = await this.client.db.auditChannels.findMany();
                type AuditVoice = typeof auditChannels[0] & { available: boolean; auditor?: string };
                const voiceChannels = [] as AuditVoice[];
                const auditors = await this.client.db.hacksAuditors.findMany({});
                for (let auditChannel of auditChannels) {
                    const channel = await newState.member.guild.channels.fetch(auditChannel.channel, { force: true });
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
                        available: channel.members.every(m => auditors.map(a => a.userId).includes(m.id)),
                        auditor: auditors
                            .filter(a => a.userId == channel.members.first().id)
                            .map(a => a.userId)
                            .join(", "),
                    });
                }
                let pings = "";
                for (let voiceChannel of voiceChannels) {
                    if (voiceChannel.available && voiceChannel.auditor) {
                        pings += `<@${voiceChannel.auditor}> `;
                    }
                }
                const userTeam = await this.client.db.hacksTeam.findFirst({ where: { members: { has: newState.member.id } } });
                if (!userTeam) {
                    return;
                }
                await auditorsChannel.send(`${pings}\n${newState.member.user.toString()} from Team ${userTeam.teamName} is in the queue!`);
            }
        }
    }
}
