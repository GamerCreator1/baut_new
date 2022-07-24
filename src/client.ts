// Setting up moment-timezone
import moment from 'moment-timezone';

// Getting and validating .env file
import EnvLoader from './classes/EnvLoader';
import DiscordClient from './structures/DiscordClient';

EnvLoader.load();

moment.locale('en');
moment.tz.setDefault('America/New_York');

const client = new DiscordClient(
    {
        presence: {
            activities: [{ type: 'WATCHING', name: 'buildergroop.com' }],
            status: 'online'
        },
        intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGES']
    },
    {
        token: process.env['TOKEN'],
        owners: ['823984033179893840', '916505894953574490', '297504183282565130']
    }
);

client.load();
export default client;
