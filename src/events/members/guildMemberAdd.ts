import { GuildMember, TextBasedChannel } from 'discord.js';

import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class GuildMemberAddEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'guildMemberAdd', 'Members');
    }

    async run(member: GuildMember) {
        const log = await this.client.db.log.findFirst({
            where: {
                log_event: 'Members',
                enabled: true
            }
        });
        if (log) {
            const logChannel = member.guild.channels.cache.get(log.channel_id) as TextBasedChannel;
            if (logChannel) {
                await logChannel.send({
                    embeds: [
                        {
                            author: { name: 'Members' },
                            color: 'DARK_PURPLE',
                            title: 'Member Joined',
                            fields: [
                                {
                                    name: 'Member',
                                    value: member.user.toString(),
                                    inline: true
                                }
                            ],
                            timestamp: new Date()
                        }
                    ]
                });
            }
        }
    }
}
