import { CacheType, Interaction, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, GuildMember, AttachmentBuilder } from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import Logger from "@classes/Logger";

export default class BuilderHacksEmbed extends Embed {
    private static sessions: Collection<string, string> = new Collection();
    private cancelled = false;

    constructor(client: DiscordClient) {
        super(
            "BuilderHacks",
            {
                content: `
**Are YOU a *young* programmer interested in winning the latest products from Apple?**

> Announcing Buildergroop's SECOND Hackathon for Gen-Z, sponsored by https://hop.io. We've got a prize pool worth **$5000 USD**, loads of workshops on today's most important technologies, and tons of fun networking activities throughout the event. 

\`●\`  You MUST click the "Register" Button to participate.
\`●\`  You MUST click the "Get Notifications" Button to get important updates during the hackathon.

\`●\`  The hackathon will start at <t:1661522400:f>.
\`●\`  Check out <#1011706065496326265> if you're looking for a teammate.
\`●\`  Check out <#1011704361543532645> to answer any queries you might have.
_ _
                `,
                files: [new AttachmentBuilder("https://cdn.discordapp.com/attachments/989278314269122640/1011735270346981516/unknown.png")],
            },
            ["register"],
            [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setLabel("Get Notifications").setCustomId("register").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setLabel("Register").setStyle(ButtonStyle.Link).setURL("https://builderhacks2.devpost.com/"),
                    new ButtonBuilder().setLabel("Learn More").setStyle(ButtonStyle.Link).setURL("https://hacks.buildergroop.com/")
                ),
            ]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton() && interaction.customId == "register") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const role = await interaction.guild.roles.fetch(process.env.BUILDERHACKS_ROLE);
                await (interaction.member as GuildMember).roles.add(role);
                await interaction.editReply("You will now be notified of important updates during BuilderHacks Season Two! Make sure you keep an eye on this channel :)");
            } catch (e) {
                Logger.log("ERROR", e.stack);
                await interaction.editReply(`Something went wrong. Please try again later.`);
            }
            // const channel = interaction.channel;
            // const hacksParticipants = await client.db.hacksParticipants.findMany();

            // if (channel.type == ChannelType.GuildText) {
            //     if (BuilderHacksEmbed.sessions.has(channel.id)) {
            //         await interaction.editReply("You are already registered for this session.");
            //         return;
            //     } else if (hacksParticipants.some(p => p.userIds.includes(interaction.user.id))) {
            //         await interaction.editReply("You are already registered for this session. If you want to edit your team or audit times, please contact the organizers.");
            //         return;
            //     }

            //     const thread = await channel.threads.create({
            //         name: "BuilderHacks Registration",
            //         autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            //         reason: `${interaction.user.tag} started registering for BuilderHacks.`,
            //         type: client.config.prod ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
            //     });
            //     BuilderHacksEmbed.sessions.set(interaction.user.id, thread.id);
            //     await interaction.editReply(`Started a thread for you to register your team: <#${thread.id}>`);

            //     let sub = {} as HacksParticipant;

            //     const initMessage = await thread.send({
            //         content: interaction.user.toString(),
            //         embeds: [
            //             new EmbedBuilder().setDescription(
            //                 "Send a message pinging your other teammate, if you have one. If you don't, send `none`. Press the red button below to cancel at any time during this process."
            //             ),
            //         ],
            //         components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel("Cancel").setCustomId("cancel").setStyle(ButtonStyle.Danger))],
            //     });

            //     const cancelFilter = (i: ButtonInteraction) => i.customId == "cancel" && i.user.id == interaction.user.id;
            //     const msgFilter = (m: Message) => m.author.id == interaction.user.id;
            //     const cancelCollector = initMessage.createMessageComponentCollector({ filter: cancelFilter, componentType: ComponentType.Button, max: 1 });
            //     cancelCollector.on("collect", async () => {
            //         await interaction.editReply("Cancelled registration.");
            //         BuilderHacksEmbed.sessions.delete(interaction.user.id);
            //         await thread.delete();
            //         this.cancelled = true;
            //     });

            //     if (this.cancelled) return;

            //     await thread
            //         .awaitMessages({ filter: msgFilter, max: 1 })
            //         .then(async c => {
            //             if (this.cancelled) return;
            //             const userIds = c.first().mentions.users.map(u => u.id);
            //             sub.userIds = [interaction.user.id, ...userIds];
            //             userIds.forEach(async u => {
            //                 if (hacksParticipants.some(p => p.userIds.includes(u))) {
            //                     await c.first().reply(`<@${u} is already registered for a team. Please contact the organizers to edit teams. Exiting process now...`);
            //                     BuilderHacksEmbed.sessions.delete(interaction.user.id);
            //                     await thread.delete();
            //                     this.cancelled = true;
            //                     return;
            //                 }
            //             });
            //             await c.first().reply("Got it! Next, send a message with your team name! Please make sure it's less than 20 characters.");
            //         })
            //         .catch(() => {
            //             sub.userIds = [interaction.user.id];
            //         });
            //     if (this.cancelled) return;
            //     const teamNameFilter = (m: Message) => m.author.id == interaction.user.id && m.content.length < 20;
            //     await thread.awaitMessages({ filter: teamNameFilter, maxProcessed: 1 }).then(async c => {
            //         if (this.cancelled) return;
            //         sub.teamName = c.first().content;
            //         await c.first().reply("Perfect! Adding your team to the database...");
            //     });
            //     if (this.cancelled) return;

            //     await client.db.hacksParticipants.create({
            //         data: sub,
            //     });

            //     await interaction.editReply("Successfully registered for BuilderHacks!");
            //     await thread.delete(`Completed registration for ${interaction.user.tag}`);
            //     BuilderHacksEmbed.sessions.delete(interaction.user.id);
            // }
        }
    }
}
