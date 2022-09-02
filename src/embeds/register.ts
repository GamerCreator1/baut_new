import {
    CacheType,
    Interaction,
    ActionRowBuilder,
    ButtonBuilder,
    Colors,
    EmbedBuilder,
    ButtonStyle,
    ButtonInteraction,
    SelectMenuBuilder,
    ComponentType,
    SelectMenuInteraction,
    TextChannel,
    ThreadAutoArchiveDuration,
    ChannelType,
    Collection,
    ThreadChannel,
    Message,
    GuildMember,
    ColorResolvable,
} from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import Logger from "@classes/Logger";

export default class RegisterEmbed extends Embed {
    private static sessions: Collection<string, string> = new Collection();
    constructor() {
        super(
            "Register",
            new EmbedBuilder({
                author: { name: "BuilderHacks" },
                title: "Final Registration Step",
                description:
                    "Click the button below to register your team for BuilderHacks! We just need to link your team name to your Discord account, and your teammmate's, if you have one.\n\n*ONLY ONE PERSON NEEDS TO REGISTER YOUR TEAM*",
            }).setColor(process.env.BUILDERGROOP_COLOR as ColorResolvable),
            ["hacks-register"],
            [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel("Register").setCustomId("hacks-register").setStyle(ButtonStyle.Primary))]
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton()) {
            await interaction.deferReply({ ephemeral: true });
            const user = interaction.user;
            try {
                const role = await interaction.guild.roles.fetch(process.env.BUILDERHACKS_ROLE);
                const auditOnerole = await interaction.guild.roles.fetch("1015306817217245216");
                const auditTworole = await interaction.guild.roles.fetch("1015306866194133012");
                await (interaction.member as GuildMember).roles.add(role);
                await (interaction.member as GuildMember).roles.add(auditOnerole);
                await (interaction.member as GuildMember).roles.add(auditTworole);
            } catch (e) {
                Logger.log("ERROR", e.stack);
            }
            if (RegisterEmbed.sessions.has(user.id)) {
                await interaction.editReply(`You are already registering at ${RegisterEmbed.sessions.get(user.id)}.`);
                return;
            }
            const previousTeam = await client.db.hacksTeam.findFirst({
                where: {
                    members: {
                        has: user.id,
                    },
                },
            });
            if (previousTeam) {
                await interaction.editReply(`You are already in a team, Team ${previousTeam.teamName}.`);
                return;
            }

            const team = [user];
            let teamName = "Unnamed";

            const thread = await (interaction.channel as TextChannel).threads.create({
                name: `${user.username} | Hacks`.slice(0, 32),
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                type: process.env.npm_lifecycle_event == "start" ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
            });
            thread.send(user.toString());
            RegisterEmbed.sessions.set(user.id, thread.id);

            await interaction.editReply(`Created a process in ${thread.toString()}`);

            await thread.send("Please ping your teammate if you have one, or type `none` if you don't have one. **TEAMS ARE LIMITED TO 2 MEMBERS**");

            const msgFilter = (msg: Message) =>
                msg.author.id === user.id &&
                ((msg.mentions.users.size > 0 && !msg.mentions.users.first().bot && msg.mentions.users.first().id != user.id) || msg.content == "none");
            await thread
                .awaitMessages({ filter: msgFilter, max: 1, time: 60000 })
                .then(async collected => {
                    const msg = collected.first();
                    if (msg.content != "none") {
                        const teammate = msg.mentions.users.first();
                        const previousTeam = await client.db.hacksTeam.findFirst({
                            where: {
                                members: {
                                    has: teammate.id,
                                },
                            },
                        });
                        if (previousTeam) {
                            interaction.editReply(`Your teammate is already in a team, Team ${previousTeam.teamName}.`);
                            await thread.delete();
                            throw "Teammate already in a team";
                        } else {
                            thread.send(`Registering you as a team with ${teammate.toString()}...\n*Your teammate will NOT need to go through this process*`);
                            team.push(teammate);
                            try {
                                const role = await interaction.guild.roles.fetch(process.env.BUILDERHACKS_ROLE);
                                const auditOnerole = await interaction.guild.roles.fetch("1015306817217245216");
                                const auditTworole = await interaction.guild.roles.fetch("1015306866194133012");
                                const teammateGuildMember = await interaction.guild.members.fetch(teammate.id);
                                await teammateGuildMember.roles.add(role);
                                await teammateGuildMember.roles.add(auditOnerole);
                                await teammateGuildMember.roles.add(auditTworole);
                            } catch (e) {
                                Logger.log("ERROR", e.stack);
                            }
                            return;
                        }
                    }
                    thread.send("Registering you as a solo participant...");
                    return;
                })
                .catch(async e => {
                    if (e == "Teammate already in a team") {
                        throw e;
                    }
                    interaction.editReply("Timed out");
                    thread.delete();
                    throw "Timed out";
                });

            await thread.send("Got it! Now, please type your team name.");

            const nameFilter = (msg: Message) => msg.author.id === user.id && msg.content.length > 0;
            await thread
                .awaitMessages({ filter: nameFilter, max: 1, time: 60000 })
                .then(collected => {
                    const msg = collected.first();
                    thread.send(`Registering you as ${msg.content}...`);
                    teamName = msg.content;
                })
                .catch(async e => {
                    await interaction.editReply("There was an error, please try again.");
                    await thread.delete();
                    throw "Timed out";
                });

            try {
                await client.db.hacksTeam.create({
                    data: {
                        teamName: teamName,
                        members: team.map(user => user.id),
                        audits: [],
                    },
                });
                await interaction.editReply("Perfect! You're now registered for BuilderHacks. Happy hacking!");
                try {
                    team.forEach(user =>
                        user.send(`You're now registered for BuilderHacks 2022!\nTeam Name: ${teamName}\nMembers: ${team.map(user => user.toString()).join(", ")}\n`)
                    );
                } catch (e) {
                    Logger.log("ERROR", e.stack);
                }
            } catch (e) {
                await thread.send(`There was an error. Please try again later.`);
                Logger.log("ERROR", e.stack);
                return;
            }
            await thread.delete();
            RegisterEmbed.sessions.delete(user.id);
        }
    }

    async onError(e): Promise<void> {
        if (e == "Teammate already in a team") return;
        else if (e == "Timed out") return;
        super.onError(e);
    }
}
