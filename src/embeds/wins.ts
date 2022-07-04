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
import { AchievementItem } from '@utils/interfaces';

export default class WinEmbed extends Embed {
    private static sessions: Collection<string, string> = new Collection();

    constructor() {
        super(
            'Win',
            {
                title: 'BuilderGroop Wins 🏆',
                description: 'Press the button below to submit a new achievement.'
            },
            ['create-win'],
            [new MessageActionRow().addComponents(new MessageButton().setLabel('Create').setCustomId('create-win').setStyle('PRIMARY'))]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton() && interaction.customId == 'create-win') {
            const winChannel = interaction.channel;
            if (winChannel.isText()) {
                if (WinEmbed.sessions.has(interaction.user.id)) {
                    interaction.reply({ content: `You already have an achievement session open. View it at <#${WinEmbed.sessions.get(interaction.user.id)}>`, ephemeral: true });
                    return;
                }
                const thread = await (winChannel as TextChannel).threads.create({
                    name: 'Create Win Item',
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                    reason: `${interaction.user.tag} started creating a new achievement`,
                    type: client.config.prod ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread
                });
                await interaction.reply({ content: `Started a process to create an achievement at ${thread.toString()}`, ephemeral: true });
                WinEmbed.sessions.set(interaction.user.id, thread.id);
                await thread.send({
                    embeds: [
                        {
                            description: 'Press the button below to fill in information about the achievement.'
                        }
                    ],
                    components: [new MessageActionRow().addComponents(new MessageButton().setLabel('Create Achievement Item').setCustomId('show-win-modal').setStyle('PRIMARY'))]
                });
                const filter = (i: ButtonInteraction) => i.customId == 'show-win-modal' && i.user.id == interaction.user.id;
                let winItem = {} as AchievementItem;
                await thread
                    .awaitMessageComponent({ componentType: 'BUTTON', filter, time: 60000 })
                    .then(async (click: ButtonInteraction) => {
                        const modal = new Modal()
                            .setCustomId('win-info-modal')
                            .setTitle('Achievement Details')
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
                        const filter = (i: ModalSubmitInteraction) => i.customId == 'win-info-modal' && i.user.id == interaction.user.id;
                        await click.awaitModalSubmit({ filter, time: 60000 }).then(async (modalSubmit: ModalSubmitInteraction) => {
                            winItem.title = modalSubmit.fields.getTextInputValue('title');
                            winItem.description = modalSubmit.fields.getTextInputValue('description');
                            winItem.urls = modalSubmit.fields.getTextInputValue('urls')?.split('\n') ?? [];
                            const parsedUrls = parseURLArray(winItem.urls);
                            await thread.send({
                                content: 'Now, send a message with any files or media you want to include, or `none` to skip ',
                                embeds: [
                                    {
                                        title: winItem.title,
                                        description: winItem.description,
                                        fields: [
                                            {
                                                name: 'URLs',
                                                value: parsedUrls.length > 0 ? parsedUrls.join('\n') : 'No URLs provided'
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
                const parsedUrls = parseURLArray(winItem.urls);
                const mediaFilter = (m: Message) => {
                    return m.author.id == interaction.user.id && (m.attachments.size > 0 || m.content.toLowerCase() == 'none');
                };
                await thread
                    .awaitMessages({ filter: mediaFilter, time: 60000, maxProcessed: 1 })
                    .then(async collected => {
                        const media = collected.first();
                        if (media) {
                            winItem.media = media.attachments.map(a => a.url);
                            await thread.send({
                                content: 'Creating your embed now...',
                                embeds: [
                                    {
                                        title: winItem.title,
                                        description: winItem.description,
                                        fields: [
                                            {
                                                name: 'URLs',
                                                value: parsedUrls.length > 0 ? parsedUrls.join('\n') : 'No URLs provided'
                                            }
                                        ]
                                    }
                                ],
                                files: winItem.media
                            });
                        }
                    })
                    .catch(e => {
                        Logger.log('ERROR', e.stack);
                        thread.delete('Session timed out');
                        interaction.editReply({ content: 'Session timed out' });
                    });
                const item = await client.db.achievement.create({
                    data: {
                        ...winItem,
                        creatorId: interaction.user.id
                    }
                });
                await thread.send('Success!');
                WinEmbed.sessions.delete(interaction.user.id);
                await thread.delete(`Created win item ${item.id}`);
                const winMessage = await winChannel.send({
                    embeds: [
                        {
                            title: winItem.title,
                            description: winItem.description,
                            author: {
                                name: interaction.user.username,
                                icon_url: interaction.user.avatarURL({ dynamic: true })
                            },
                            color: '#491774',
                            fields:
                                parsedUrls.length > 0
                                    ? [
                                          {
                                              name: 'URLs',
                                              value: parsedUrls.join('\n')
                                          }
                                      ]
                                    : [],
                            timestamp: new Date()
                        }
                    ],
                    files: winItem.media
                });
                await winMessage.startThread({
                    name: winItem.title,
                    reason: 'Achievement item',
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
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
