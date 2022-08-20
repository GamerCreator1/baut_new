import { IConfig } from "@utils/interfaces";

const config: IConfig = {
    clientId: process.env.npm_lifecycle_event === "start" ? process.env.CLIENT_ID : process.env.TEST_CLIENT_ID,
    guildId: process.env.npm_lifecycle_event === "start" ? process.env.GUILD_ID : process.env.TEST_GUILD_ID,
    developers: (process.env.DEVELOPERS ?? "").split(", "),
    activeRole: process.env.ACTIVE_ROLE,
    unknownErrorMessage: true,
    prod: process.env.npm_lifecycle_event === "start",
};
export default config;
