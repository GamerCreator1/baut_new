import { PermissionString } from 'discord.js';

/**
 * Config interface for client.
 */
export interface IConfig {
    /** Client id of the client */
    clientId: string;

    /** Guild id of the client */
    guildId: string;

    /** Developer ids of the client */
    developers: string[];

    /**
     * Status of sending error message when user try to run unknown command.
     */
    unknownErrorMessage: boolean;
}

/**
 * Information interface for commands.
 */
export interface ICommandInfo {
    /** Group name of the command */
    group: string;

    /** Example usages */
    examples?: string[];
    /**
     * Time to wait for each use (seconds)
     *
     * Developers are not affected
     */
    cooldown?: number;

    /** Status of the command */
    enabled?: boolean;

    /**
     * If enabled, command only runs in nsfw channels
     *
     * Developers are not affected
     */
    onlyNsfw?: boolean;

    /** Requirements of the command */
    require?: ICommandRequire;

    /** Autocomplete Options */
    autocomplete?: { name: string; value: string }[];
}

/**
 * Requirement interface for commands.
 */
export interface ICommandRequire {
    /** If enabled, command requires developer permission to run */
    developer?: boolean;

    /**
     * Command requires permission flags to run
     *
     * Developers are not affected
     */
    permissions?: PermissionString[];
}
