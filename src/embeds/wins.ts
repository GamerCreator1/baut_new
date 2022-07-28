import { ChannelType, ThreadAutoArchiveDuration } from 'discord-api-types/v10';
import {
    ButtonInteraction,
    CacheType,
    Collection,
    ColorResolvable,
    Interaction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
    Modal,
    ModalActionRowComponent,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    TextChannel,
    TextInputComponent
} from 'discord.js';

import Logger from '@classes/Logger';
import DiscordClient from '@structures/DiscordClient';
import Embed from '@structures/Embed';
import { AchievementItem } from '@utils/interfaces';

export default class WinEmbed extends Embed {
    private static sessions: Collection<string, string> = new Collection();
    private static cooldowns: Collection<string, Date> = new Collection();
    private cancelled = false;

    constructor() {
        super(
            'Win',
            {
                title: 'BuilderGroop Wins 🏆',
                description: 'Press the button below to submit a new achievement.'
            },
            ['create-win', 'win/'],
            [new MessageActionRow().addComponents(new MessageButton().setLabel('Create').setCustomId('create-win').setStyle('PRIMARY'))],
            true
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton() && interaction.customId == 'create-win') {
            const winChannel = interaction.channel;
            let winItem = {} as AchievementItem;
            if (winChannel.isText()) {
                if (WinEmbed.sessions.has(interaction.user.id)) {
                    interaction.reply({ content: `You already have an achievement session open. View it at <#${WinEmbed.sessions.get(interaction.user.id)}>`, ephemeral: true });
                    return;
                } else if (WinEmbed.cooldowns.has(interaction.user.id)) {
                    const cooldown = WinEmbed.cooldowns.get(interaction.user.id);
                    const timeLeft = cooldown.getTime() - Date.now();
                    interaction.reply({ content: `You must wait ${Math.floor(timeLeft / 60000)} minutes before creating another achievement.`, ephemeral: true });
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
                const initMessage = await thread.send({
                    content: interaction.user.toString(),
                    embeds: [
                        {
                            description: 'Send a message with the **title** of your achievement. Press the red button below at any time to cancel this process.'
                        }
                    ],
                    components: [new MessageActionRow().addComponents(new MessageButton().setLabel('Cancel').setStyle('DANGER').setCustomId('cancel'))]
                });
                const cancelFilter = (i: ButtonInteraction) => i.customId == 'cancel' && i.user.id == interaction.user.id;
                const cancelCollector = initMessage.createMessageComponentCollector({ filter: cancelFilter, max: 1 }).on('collect', async () => {
                    await interaction.editReply({ content: 'Cancelled creation of an achievement item.' });
                    if (WinEmbed.sessions.has(interaction.user.id)) {
                        WinEmbed.sessions.delete(interaction.user.id);
                    }
                    thread.delete();
                    this.cancelled = true;
                });
                const msgFilter = (m: Message) => m.author.id == interaction.user.id;
                if (this.cancelled) return;
                await thread
                    .awaitMessages({ filter: msgFilter, maxProcessed: 1, time: 60000, errors: ['threadDelete'] })
                    .then(async collected => {
                        winItem.title = collected.first().content;
                        await thread.send({
                            embeds: [{ description: 'Next, send a brief **description** of your achievement.' }]
                        });
                    })
                    .catch(async e => {
                        if (this.cancelled) {
                            await interaction.editReply({ content: 'Cancelled creation of an achievement.' });
                        } else {
                            await interaction.editReply({ content: 'Timed out waiting for a response.' });
                            await thread.delete();
                        }
                    });
                if (this.cancelled) return;
                await thread
                    .awaitMessages({ filter: msgFilter, maxProcessed: 1, time: 60000, errors: ['threadDelete'] })
                    .then(async collected => {
                        winItem.description = collected.first().content;
                        await thread.send({
                            embeds: [{ description: 'Now, send any **links** to your achievement. separated by commas(`link1, link2`), or `none` to skip.' }]
                        });
                    })
                    .catch(async e => {
                        if (this.cancelled) {
                            await interaction.editReply({ content: 'Cancelled creation of an achievement.' });
                        } else {
                            await interaction.editReply({ content: 'Timed out waiting for a response.' });
                            await thread.delete();
                        }
                    });
                if (this.cancelled) return;
                await thread
                    .awaitMessages({ filter: msgFilter, maxProcessed: 1, time: 60000, errors: ['threadDelete'] })
                    .then(async collected => {
                        winItem.urls = collected.first().content.split('\n');
                        await thread.send({
                            embeds: [{ description: 'Now, send a message with any files or media you want to include, or `none` to skip.' }]
                        });
                    })
                    .catch(async e => {
                        if (this.cancelled) {
                            await interaction.editReply({ content: 'Cancelled creation of an achievement.' });
                        } else {
                            await interaction.editReply({ content: 'Timed out waiting for a response.' });
                            await thread.delete();
                        }
                    });
                if (this.cancelled) return;
                const parsedUrls = parseURLArray(winItem.urls);
                const mediaFilter = (m: Message) => {
                    return m.author.id == interaction.user.id && (m.attachments.size > 0 || m.content.toLowerCase() == 'none');
                };
                if (this.cancelled) return;
                await thread
                    .awaitMessages({ filter: mediaFilter, time: 60000, maxProcessed: 1, errors: ['threadDelete'] })
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
                        if (!this.cancelled) thread.delete('Session timed out');
                        interaction.editReply({ content: 'Session timed out' });
                    });
                if (this.cancelled) return;
                const item = await client.db.achievement.create({
                    data: {
                        ...winItem,
                        creatorId: interaction.user.id,
                        clapCount: 0,
                        clappers: []
                    }
                });
                await thread.send('Success!');
                WinEmbed.sessions.delete(interaction.user.id);
                WinEmbed.cooldowns.set(interaction.user.id, new Date(Date.now() + 60 * 30 * 1000));
                setTimeout(() => WinEmbed.cooldowns.delete(interaction.user.id), 60 * 30 * 1000);
                cancelCollector.stop();
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
                            color: process.env.BUILDERGROOP_COLOR as ColorResolvable,
                            fields:
                                parsedUrls.length > 0
                                    ? [
                                          {
                                              name: 'URLs',
                                              value: parsedUrls.join('\n')
                                          }
                                      ]
                                    : [],
                            timestamp: new Date(),
                            footer: { text: '0 👏' }
                        }
                    ],
                    files: winItem.media,
                    components: [new MessageActionRow().addComponents(new MessageButton().setLabel('Clap').setEmoji('👏').setCustomId(`win/${item.id}`).setStyle('SUCCESS'))]
                });
                await winMessage.startThread({
                    name: winItem.title,
                    reason: 'Achievement item',
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
                });
            }
        } else if (interaction.isButton() && interaction.customId.startsWith('win/')) {
            await interaction.deferReply({ ephemeral: true });
            const winMessage = interaction.message as Message<boolean>;
            const id = parseInt(interaction.customId.split('/')[1]);
            const item = await client.db.achievement.findFirst({ where: { id } });
            if (item) {
                if (item.clappers.includes(interaction.user.id)) {
                    item.clappers = item.clappers.filter(u => u != interaction.user.id);
                    item.clapCount--;
                    await interaction.editReply({ content: 'Removed your clap.' });
                } else {
                    item.clappers.push(interaction.user.id);
                    item.clapCount++;
                    await interaction.editReply({ content: 'Clapped! 👏' });
                }
                await client.db.achievement.update({
                    where: { id },
                    data: {
                        clappers: item.clappers,
                        clapCount: item.clapCount
                    }
                });
                await winMessage.edit({
                    embeds: [winMessage.embeds[0].setFooter({ text: `${item.clapCount} 👏` })]
                });
            } else {
                await interaction.editReply({ content: 'There was an issue.' });
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
