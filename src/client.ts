// Getting and validating .env file
import EnvLoader from './classes/EnvLoader';
EnvLoader.load();

// Setting up moment-timezone
import moment from 'moment-timezone';
moment.locale('en');
moment.tz.setDefault('America/New_York');

import DiscordClient from './structures/DiscordClient';

const client = new DiscordClient(
    {
        ws: {
            properties: {
                $browser: 'Discord iOS'
            }
        },
        presence: {
            activities: [{ type: 'WATCHING', name: 'buildergroop.com' }]
        },
        intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGE_REACTIONS']
    },
    {
        token: process.env['TOKEN'],
        owners: ['823984033179893840', '916505894953574490']
    }
);

client.load();
export default client;
