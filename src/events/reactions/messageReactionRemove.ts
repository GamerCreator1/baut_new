import { MessageReaction, User } from 'discord.js';

import { Prisma } from '@prisma/client';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class MessageReactionRemoveEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'messageReactionRemove', false);
    }

    async run(messageReaction: MessageReaction, user: User) {
        console.log('E');
        const channel = messageReaction.message.channel;
        if (channel.type == 'DM') return;
        const messageId = messageReaction.message.id;

        const reactionRoles = await this.client.db.reactionroles.findMany();
        const reactionRole = reactionRoles.find(reactionRole => reactionRole.messageid === messageId);
        if (!reactionRole) return;
        console.log(1);

        const role = channel.guild.roles.cache.find(role => role.id === reactionRole.roles[messageReaction.emoji.name]);
        if (!role) return;
        console.log(2);

        const member = await channel.guild.members.fetch(user.id);
        if (!member) return;
        console.log(3);

        await member.roles.remove(role);
    }
}
