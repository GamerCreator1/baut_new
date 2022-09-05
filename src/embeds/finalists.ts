import { CacheType, Interaction, EmbedBuilder } from "discord.js";

import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import moment from "moment";

export default class FinalistsEmbed extends Embed {
    constructor() {
        super(
            "Finalists",
            new EmbedBuilder({
                title: "Finalists",
            }),
            ["finalists-vote/"],
            []
        );
    }

    async onInteraction(interaction: Interaction<CacheType>, client: DiscordClient): Promise<void> {
        if (interaction.isButton()) {
            await interaction.deferReply({ ephemeral: true });

            const id = parseInt(interaction.customId.slice(15));
            const project = await client.db.hacksFinalist.findFirst({ where: { id: id } });

            const userAlreadyVoted = !!(await client.db.hackVote.findUnique({ where: { voterDiscordID: interaction.user.id } }));

            const guild = client.guilds.cache.get(process.env.GUILD_ID);
            const member = await guild.members.fetch(interaction.user);

            console.log(member.joinedAt);
            const joinedBeforeHackathon = moment(member.joinedAt).isBefore("2022-09-05T12:51:11-04:00");

            if (joinedBeforeHackathon) {
                if (userAlreadyVoted) {
                    const previousVote = await client.db.hackVote.findUnique({ where: { voterDiscordID: interaction.user.id } });

                    await client.db.hackVote.update({
                        where: { voterDiscordID: interaction.user.id },
                        data: { HacksFinalist: { connect: { id } } },
                    });

                    await client.db.hacksFinalist.update({ where: { id }, data: { voteCount: { increment: 1 } } });
                    await client.db.hacksFinalist.update({ where: { id: previousVote.hacksFinalistId }, data: { voteCount: { decrement: 1 } } });

                    interaction.editReply(`Your vote has been changed to "${project.projectName}"! The results will be declared **<t:1662481800:R>**.`);
                } else {
                    await client.db.hackVote.create({
                        data: {
                            voterDiscordID: interaction.user.id,
                            HacksFinalist: { connect: { id } },
                        },
                    });
                    await client.db.hacksFinalist.update({ where: { id }, data: { voteCount: { increment: 1 } } });

                    interaction.editReply(`Your vote has been anonymously casted for the project "${project.projectName}"! The results will be declared **<t:1662481800:R>**.`);
                }
            } else {
                interaction.editReply("Apologies! As a safety precaution, voting is disabled for members that joined after BuilderHacks Season Two ended.");
            }
        }
    }
}
