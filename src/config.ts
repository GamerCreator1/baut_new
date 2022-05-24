import { IConfig } from '@utils/interfaces';

const config: IConfig = {
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    developers: process.env.DEVELOPERS.split(', '),
    unknownErrorMessage: true
};

export default config;
