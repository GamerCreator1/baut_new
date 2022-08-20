// Setting up moment-timezone
import Logger from "@classes/Logger";
import moment from "moment-timezone";

// Getting and validating .env file
import EnvLoader from "@classes/EnvLoader";

EnvLoader.load();

import DiscordClient from "@structures/DiscordClient";

moment.locale("en");
moment.tz.setDefault("America/New_York");
Logger.log("INFO", "Starting up in " + (process.env.npm_lifecycle_event == "start" ? "🛠️ production" : "💻 development") + "...");

const client = new DiscordClient(
    {
        presence: {
            activities: [{ type: "WATCHING", name: "buildergroop.com" }],
            status: "online",
        },
        intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGES"],
    },
    {
        token: process.env.npm_lifecycle_event == "start" ? process.env["TOKEN"] : process.env["TEST_TOKEN"],
        owners: ["823984033179893840", "916505894953574490", "297504183282565130"],
    }
);

client.load();

export default client;
