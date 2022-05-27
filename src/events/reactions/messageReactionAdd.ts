import { MessageReaction, User } from 'discord.js';

import { Prisma } from '@prisma/client';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class MessageReactionAddEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'messageReactionAdd', false);
    }

    async run(messageReaction: MessageReaction, user: User) {
        const channel = messageReaction.message.channel;
        if (channel.type == 'DM') return;
        const messageId = messageReaction.message.id;

        const reactionRoles = await this.client.db.reactionroles.findMany();
        const reactionRole = reactionRoles.find(reactionRole => reactionRole.messageid === messageId);
        if (!reactionRole) return;

        const role = channel.guild.roles.cache.find(role => role.id === reactionRole.roles[messageReaction.emoji.name]);
        if (!role) return;

        const member = await channel.guild.members.fetch(user.id);
        if (!member) return;

        const toggleReactionRole = reactionRole.toggle;

        if (toggleReactionRole) {
            // remove any other roles in the reaction role if the user has them, and add the one they selected, and then remove their reaction on the other reaction roles using the emoji
            const roles = member.roles.cache.filter(role => Object.values(reactionRole.roles).includes(role) && role.id !== reactionRole.roles[messageReaction.emoji.name]);
            await member.roles.remove(roles);
            await member.roles.add(role);
            messageReaction.message.reactions.cache.forEach(reaction => {
                if (reaction.emoji.name !== messageReaction.emoji.name) {
                    reaction.users.remove(user);
                }
            });
        } else {
            await member.roles.add(role);
        }
    }
}
