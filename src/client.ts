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
