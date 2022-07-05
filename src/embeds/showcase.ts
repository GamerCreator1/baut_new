import { ChannelType, ThreadAutoArchiveDuration } from 'discord-api-types/v10';
import {
    ButtonInteraction, CacheType, Collection, Interaction, Message, MessageActionRow, MessageButton,
    MessageSelectMenu, Modal, ModalActionRowComponent, ModalSubmitInteraction,
    SelectMenuInteraction, TextChannel, TextInputComponent
} from 'discord.js';

import Logger from '@classes/Logger';
import { ModalBuilder } from '@discordjs/builders';
import DiscordClient from '@structures/DiscordClient';
import Embed from '@structures/Embed';
import { ShowcaseItem } from '@utils/interfaces';

export default class ShowcaseEmbed extends Embed {
    private static sessions: Collection<string, string> = new Collection();
    private static cooldowns: Collection<string, Date> = new Collection();
    private cancelled = false;

    constructor() {
        super(
            'Showcase',
            {
                title: 'BuilderGroop Showcase 🎖',
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
                if (ShowcaseEmbed.sessions.has(interaction.user.id)) {
                    interaction.reply({ content: `You already have a showcase session open. View it at <#${ShowcaseEmbed.sessions.get(interaction.user.id)}>`, ephemeral: true });
                    return;
                } else if (ShowcaseEmbed.cooldowns.has(interaction.user.id)) {
                    const cooldown = ShowcaseEmbed.cooldowns.get(interaction.user.id);
                    const timeLeft = cooldown.getTime() - Date.now();
                    interaction.reply({ content: `You must wait ${Math.floor(timeLeft / 60000)} minutes before creating another achievement.`, ephemeral: true });
                    return;
                }
                const thread = await (showcaseChannel as TextChannel).threads.create({
                    name: 'Create Showcase Item',
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                    reason: `${interaction.user.tag} started creating a new showcase item`,
                    type: client.config.prod ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread
                });
                await interaction.reply({ content: `Started a process to create a showcase item at ${thread.toString()}`, ephemeral: true });
                ShowcaseEmbed.sessions.set(interaction.user.id, thread.id);
                const initMessage = await thread.send({
                    content: interaction.user.toString(),
                    embeds: [
                        {
                            description: 'Press the blue button below to fill in information about the showcase item. Press the red button below to cancel at any time.'
                        }
                    ],
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setLabel('Create Showcase Item').setCustomId('show-showcase-modal').setStyle('PRIMARY'),
                            new MessageButton().setLabel('Cancel').setStyle('DANGER').setCustomId('cancel')
                        )
                    ]
                });
                const cancelFilter = (i: ButtonInteraction) => i.customId == 'cancel' && i.user.id == interaction.user.id;
                const cancelCollector = initMessage.createMessageComponentCollector({ filter: cancelFilter, max: 1 }).on('collect', async () => {
                    await interaction.editReply({ content: 'Cancelled creation of a showcase item.' });
                    ShowcaseEmbed.sessions.delete(interaction.user.id);
                    thread.delete();
                    this.cancelled = true;
                });
                const filter = (i: ButtonInteraction) => i.customId == 'show-showcase-modal' && i.user.id == interaction.user.id;
                let showcaseItem = {} as ShowcaseItem;
                if (this.cancelled) return;
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
                                    new TextInputComponent().setLabel('URLs(separated by new line)').setStyle('PARAGRAPH').setCustomId('urls')
                                )
                            );
                        await click.showModal(modal);
                        const filter = (i: ModalSubmitInteraction) => i.customId == 'showcase-info-modal' && i.user.id == interaction.user.id;
                        await click.awaitModalSubmit({ filter, time: 60000 }).then(async (modalSubmit: ModalSubmitInteraction) => {
                            showcaseItem.title = modalSubmit.fields.getTextInputValue('title');
                            showcaseItem.description = modalSubmit.fields.getTextInputValue('description');
                            showcaseItem.urls = modalSubmit.fields.getTextInputValue('urls')?.split('\n') ?? [];
                            const parsed = parseURLArray(showcaseItem.urls);
                            await thread.send({
                                content: 'Now, select the type of your showcase submission.',
                                embeds: [
                                    {
                                        title: showcaseItem.title,
                                        description: showcaseItem.description,
                                        fields: [
                                            {
                                                name: 'URLs',
                                                value: parsed.length > 0 ? parseURLArray(showcaseItem.urls).join('\n') : 'No URLs provided'
                                            }
                                        ],
                                        color: parseType(showcaseItem.type)
                                    }
                                ],
                                components: [
                                    new MessageActionRow().addComponents(
                                        new MessageSelectMenu().setPlaceholder('Select a Type').setCustomId('type').setMaxValues(1).setOptions(
                                            {
                                                label: 'Startup',
                                                value: 'Startup'
                                            },
                                            {
                                                label: 'Project',
                                                value: 'Project'
                                            },
                                            {
                                                label: 'Community',
                                                value: 'Community'
                                            },
                                            {
                                                label: 'Article',
                                                value: 'Article'
                                            },
                                            {
                                                label: 'Design',
                                                value: 'Design'
                                            },
                                            {
                                                label: 'Tweet',
                                                value: 'Tweet'
                                            },
                                            {
                                                label: 'Open-Source',
                                                value: 'Open-Source'
                                            }
                                        )
                                    )
                                ]
                            });
                            await modalSubmit.reply({ content: 'Success!', ephemeral: true });
                        });
                    })
                    .catch(e => {
                        Logger.log('ERROR', e.stack);
                        thread.delete('Session timed out');
                        interaction.editReply({ content: 'Session timed out' });
                        throw e;
                    });
                const typeFilter = (i: SelectMenuInteraction) => i.user.id == interaction.user.id && i.customId == 'type';
                const parsed = parseURLArray(showcaseItem.urls);
                await thread.awaitMessageComponent({ componentType: 'SELECT_MENU', filter: typeFilter, time: 60000 }).then(async (select: SelectMenuInteraction) => {
                    showcaseItem.type = select.values[0] as ShowcaseItem['type'];
                    await thread.send({
                        content: 'Now, send a message with any files or media you want to include, or `none` to skip ',
                        embeds: [
                            {
                                author: {
                                    name: showcaseItem.type.toString()
                                },
                                title: showcaseItem.title,
                                description: showcaseItem.description,
                                fields: [
                                    {
                                        name: 'URLs',
                                        value: parsed.length > 0 ? parsed.join('\n') : 'No URLs provided'
                                    }
                                ],
                                color: parseType(showcaseItem.type)
                            }
                        ]
                    });
                });
                const mediaFilter = (m: Message) => {
                    return m.author.id == interaction.user.id && (m.attachments.size > 0 || m.content.toLowerCase() == 'none');
                };
                if (this.cancelled) return;
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
                                        author: {
                                            name: showcaseItem.type.toString()
                                        },
                                        title: showcaseItem.title,
                                        description: showcaseItem.description,
                                        fields: [
                                            {
                                                name: 'URLs',
                                                value: parsed.length > 0 ? parsed.join('\n') : 'No URLs provided'
                                            }
                                        ],
                                        color: parseType(showcaseItem.type)
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
                        throw e;
                    });

                const userMentionFilter = (m: Message) => m.author.id == interaction.user.id && m.mentions.users.size > 0;
                if (this.cancelled) return;
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
                                        author: {
                                            name: showcaseItem.type.toString()
                                        },
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
                                                value: parsed.length > 0 ? parsed.join('\n') : 'No URLs provided'
                                            }
                                        ],
                                        color: parseType(showcaseItem.type)
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
                        throw e;
                    });

                const item = await client.db.showcaseItem.create({
                    data: {
                        ...showcaseItem,
                        creatorId: interaction.user.id,
                        createdAt: new Date(),
                        upvoteCount: 0,
                        downvoteCount: 0,
                        upvoterIds: [],
                        downvoterIds: [],
                        type: dbParseType(showcaseItem.type)
                    }
                });
                if (this.cancelled) return;
                await thread.send('Success!');
                ShowcaseEmbed.sessions.delete(interaction.user.id);
                await thread.delete(`Created showcase item ${item.id}`);
                ShowcaseEmbed.cooldowns.set(interaction.user.id, new Date(Date.now() + 60 * 30 * 1000));
                setTimeout(() => ShowcaseEmbed.cooldowns.delete(interaction.user.id), 60 * 30 * 1000);
                cancelCollector.stop();
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
                                name: `${interaction.user.username} • ${showcaseItem.type}`,
                                icon_url: interaction.user.avatarURL({ dynamic: true })
                            },
                            color: parseType(showcaseItem.type),
                            fields: [
                                {
                                    name: 'URLs',
                                    value: parsed.length > 0 ? parsed.join('\n') : 'No URLs provided'
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
            return [];
        }
    });
};

const parseType = (type: ShowcaseItem['type']) => {
    switch (type) {
        case 'Startup':
            return '#23362b';
        case 'Community':
            return '#1bb28c';
        case 'Article':
            return '#e86a58';
        case 'Design':
            return '#fed45b';
        case 'Open-Source':
            return '#9bc7c5';
        case 'Tweet':
            return '#efeeea';
        case 'Project':
            return '#219ebc';
    }
};

const dbParseType = (type: ShowcaseItem['type']) => {
    switch (type) {
        case 'Startup':
            return 'STARTUP';
        case 'Community':
            return 'COMMUNITY';
        case 'Article':
            return 'ARTICLE';
        case 'Design':
            return 'DESIGN';
        case 'Open-Source':
            return 'OPEN_SOURCE';
        case 'Tweet':
            return 'TWEET';
        case 'Project':
            return 'PROJECT';
    }
};
