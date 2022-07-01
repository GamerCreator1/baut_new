import { ChannelType, ThreadAutoArchiveDuration } from 'discord-api-types/v10';
import {
    ButtonInteraction, CacheType, Interaction, Message, MessageActionRow, MessageButton, Modal,
    ModalActionRowComponent, ModalSubmitInteraction, TextChannel, TextInputComponent
} from 'discord.js';

import Logger from '@classes/Logger';
import { ModalBuilder } from '@discordjs/builders';
import DiscordClient from '@structures/DiscordClient';
import Embed from '@structures/Embed';
import { ShowcaseItem } from '@utils/interfaces';

export default class ShowcaseEmbed extends Embed {
    constructor() {
        super(
            'Showcase',
            {
                title: 'BuilderGroop Showcase',
                description: 'Press the button below to create a new showcase item.'
            },
            ['create-showcase', 'showcase/'],
            [new MessageActionRow().addComponents(new MessageButton().setLabel('Create').setCustomId('create-showcase').setStyle('PRIMARY'))]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton() && interaction.customId == 'create-showcase') {
            const showcaseChannel = interaction.channel;
            if (showcaseChannel.isText()) {
                const thread = await (showcaseChannel as TextChannel).threads.create({
                    name: 'Create Showcase Item',
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                    reason: `${interaction.user.tag} started creating a new showcase item`,
                    type: client.config.prod ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread
                });
                await interaction.reply({ content: `Started a process to create a showcase item at ${thread.toString()}`, ephemeral: true });
                await thread.send({
                    embeds: [
                        {
                            description: 'Press the button below to fill in information about the showcase item.'
                        }
                    ],
                    components: [new MessageActionRow().addComponents(new MessageButton().setLabel('Create Showcase Item').setCustomId('show-showcase-modal').setStyle('PRIMARY'))]
                });
                const filter = (i: ButtonInteraction) => i.customId == 'show-showcase-modal' && i.user.id == interaction.user.id;
                let showcaseItem = {} as ShowcaseItem;
                await thread
                    .awaitMessageComponent({ componentType: 'BUTTON', filter, time: 60000 })
                    .then(async (click: ButtonInteraction) => {
                        const modal = new Modal()
                            .setCustomId('showcase-info-modal')
                            .setTitle('Showcase Details')
                            .addComponents(
                                new MessageActionRow<ModalActionRowComponent>().addComponents(
                                    new TextInputComponent().setLabel('Title').setStyle('SHORT').setCustomId('title').setMaxLength(256).setRequired(true)
                                ),
                                new MessageActionRow<ModalActionRowComponent>().addComponents(
                                    new TextInputComponent().setLabel('Description').setStyle('PARAGRAPH').setCustomId('description').setRequired(true)
                                ),
                                new MessageActionRow<ModalActionRowComponent>().addComponents(
                                    new TextInputComponent().setLabel('URLs(separated by new line)').setStyle('PARAGRAPH').setCustomId('urls').setRequired(true)
                                )
                            );
                        await click.showModal(modal);
                        const filter = (i: ModalSubmitInteraction) => i.customId == 'showcase-info-modal' && i.user.id == interaction.user.id;
                        await click.awaitModalSubmit({ filter, time: 60000 }).then(async (modalSubmit: ModalSubmitInteraction) => {
                            showcaseItem.title = modalSubmit.fields.getTextInputValue('title');
                            showcaseItem.description = modalSubmit.fields.getTextInputValue('description');
                            showcaseItem.urls = modalSubmit.fields.getTextInputValue('urls').split('\n');
                            await thread.send({
                                content: 'Now, send a message with any files or media you want to include, or `none` to skip ',
                                embeds: [
                                    {
                                        title: showcaseItem.title,
                                        description: showcaseItem.description,
                                        fields: [
                                            {
                                                name: 'URLs',
                                                value: parseURLArray(showcaseItem.urls).join('\n')
                                            }
                                        ]
                                    }
                                ]
                            });
                            await modalSubmit.reply({ content: 'Success!', ephemeral: true });
                        });
                    })
                    .catch(e => {
                        Logger.log('ERROR', e.stack);
                        thread.delete('Session timed out');
                        interaction.editReply({ content: 'Session timed out' });
                    });

                const mediaFilter = (m: Message) => {
                    return m.author.id == interaction.user.id && (m.attachments.size > 0 || m.content.toLowerCase() == 'none');
                };
                await thread
                    .awaitMessages({ filter: mediaFilter, time: 60000, maxProcessed: 1 })
                    .then(async collected => {
                        const media = collected.first();
                        if (media) {
                            showcaseItem.media = media.attachments.map(a => a.url);
                            await thread.send({
                                content: 'Lastly, send a message pinging any users you want to include, or `none` to skip.',
                                embeds: [
                                    {
                                        title: showcaseItem.title,
                                        description: showcaseItem.description,
                                        fields: [
                                            {
                                                name: 'URLs',
                                                value: parseURLArray(showcaseItem.urls).join('\n')
                                            }
                                        ]
                                    }
                                ],
                                files: showcaseItem.media
                            });
                        }
                    })
                    .catch(e => {
                        Logger.log('ERROR', e.stack);
                        thread.delete('Session timed out');
                        interaction.editReply({ content: 'Session timed out' });
                    });

                const userMentionFilter = (m: Message) => m.author.id == interaction.user.id && m.mentions.users.size > 0;
                await thread
                    .awaitMessages({ filter: userMentionFilter, time: 60000, maxProcessed: 1 })
                    .then(async collected => {
                        const userMentions = collected.first();
                        if (userMentions) {
                            showcaseItem.collaboratorIds = userMentions.mentions.users.map(u => u.id);
                            await thread.send({
                                content: 'Creating your embed now...',
                                embeds: [
                                    {
                                        title: showcaseItem.title,
                                        description:
                                            showcaseItem.description +
                                            `\n
                                            **Collaborators**:
                                            ${showcaseItem.collaboratorIds.map(u => `<@${u}>`).join('\n')}
                                            `,
                                        fields: [
                                            {
                                                name: 'URLs',
                                                value: parseURLArray(showcaseItem.urls).join('\n')
                                            }
                                        ]
                                    }
                                ],
                                files: showcaseItem.media
                            });
                        }
                    })
                    .catch(e => {
                        Logger.log('ERROR', e.stack);
                        thread.delete('Session timed out');
                        interaction.editReply({ content: 'Session timed out' });
                    });

                const item = await client.db.showcaseItem.create({
                    data: {
                        ...showcaseItem,
                        creatorId: interaction.user.id,
                        createdAt: new Date(),
                        upvoteCount: 0,
                        downvoteCount: 0,
                        upvoterIds: [],
                        downvoterIds: []
                    }
                });
                await thread.send('Success!');
                await thread.delete(`Created showcase item ${item.id}`);
                const showcaseMessage = await showcaseChannel.send({
                    embeds: [
                        {
                            title: showcaseItem.title,
                            description:
                                showcaseItem.description +
                                `\n
                                **Collaborators**:
                                ${showcaseItem.collaboratorIds?.map(u => `<@${u}>`).join('\n') ?? 'None'}
                                `,
                            author: {
                                name: interaction.user.username,
                                icon_url: interaction.user.avatarURL({ dynamic: true })
                            },
                            color: '#b827f6',
                            fields: [
                                {
                                    name: 'Links',
                                    value: parseURLArray(showcaseItem.urls).join('\n')
                                }
                            ],
                            footer: {
                                text: '0 🔺'
                            },
                            timestamp: new Date()
                        }
                    ],
                    files: showcaseItem.media,
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setLabel('Downvote').setStyle('DANGER').setEmoji('🔻').setCustomId(`showcase/downvote/${item.id}`),
                            new MessageButton().setLabel('Clear').setStyle('SECONDARY').setEmoji('❌').setCustomId(`showcase/clear/${item.id}`),
                            new MessageButton().setLabel('Upvote').setStyle('SUCCESS').setEmoji('🔺').setCustomId(`showcase/upvote/${item.id}`)
                        )
                    ]
                });
                await showcaseMessage.startThread({
                    name: showcaseItem.title,
                    reason: 'Showcase item',
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
                });
            }
        } else if (interaction.isButton() && interaction.customId.startsWith('showcase/')) {
            await interaction.deferReply({ ephemeral: true });
            const showcaseMessage = interaction.message as Message<boolean>;
            const id = parseInt(interaction.customId.split('/')[2]);
            const userId = interaction.user.id;
            const action = interaction.customId.split('/')[1];
            const item = await prisma.showcaseItem.findFirst({
                where: {
                    id
                }
            });
            if (item) {
                switch (action) {
                    case 'upvote':
                        if (!item.upvoterIds.includes(userId)) {
                            item.upvoterIds.push(userId);
                            item.upvoteCount++;
                            if (item.downvoterIds.includes(userId)) {
                                item.downvoterIds.splice(item.downvoterIds.indexOf(userId), 1);
                                item.downvoteCount--;
                                await interaction.editReply('Removed your downvote and added an upvote.');
                                break;
                            }
                            await interaction.editReply('Upvoted!');
                            break;
                        } else {
                            item.upvoterIds.splice(item.upvoterIds.indexOf(userId), 1);
                            item.upvoteCount--;
                            await interaction.editReply('Removed your upvote.');
                            break;
                        }
                    case 'downvote':
                        if (!item.downvoterIds.includes(userId)) {
                            item.downvoterIds.push(userId);
                            item.downvoteCount++;
                            if (item.upvoterIds.includes(userId)) {
                                item.upvoterIds.splice(item.upvoterIds.indexOf(userId), 1);
                                item.upvoteCount--;
                                await interaction.editReply('Removed your upvote and added a downvote.');
                                break;
                            }
                            await interaction.editReply('Downvoted!');
                            break;
                        } else {
                            item.downvoterIds.splice(item.downvoterIds.indexOf(userId), 1);
                            item.downvoteCount--;
                            await interaction.editReply('Removed your downvote.');
                            break;
                        }
                    case 'clear':
                        if (item.downvoterIds.includes(userId)) {
                            item.downvoterIds.splice(item.downvoterIds.indexOf(userId), 1);
                            item.downvoteCount--;
                            await interaction.editReply('Removed your downvote');
                            break;
                        } else if (item.upvoterIds.includes(userId)) {
                            item.upvoterIds.splice(item.upvoterIds.indexOf(userId), 1);
                            item.upvoteCount--;
                            await interaction.editReply('Removed your upvote.');
                            break;
                        } else {
                            await interaction.editReply('You have not voted on this item.');
                        }
                    default:
                        break;
                }
                await prisma.showcaseItem.update({
                    where: {
                        id
                    },
                    data: {
                        upvoterIds: item.upvoterIds,
                        downvoterIds: item.downvoterIds,
                        upvoteCount: item.upvoteCount,
                        downvoteCount: item.downvoteCount
                    }
                });
                const upvoteCount = item.upvoteCount;
                await showcaseMessage.edit({
                    embeds: [showcaseMessage.embeds[0].setFooter({ text: `${upvoteCount} 🔺` })]
                });
            }
        }
    }
}

const parseURLArray = (urls: string[]) => {
    return urls.flatMap(u => {
        try {
            return [`[${new URL(u).hostname}](${u})`];
        } catch (e) {
            Logger.log('ERROR', e.stack);
            return [];
        }
    });
};
