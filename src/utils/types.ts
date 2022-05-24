/**
 * Type for logging.
 */
export type LogType = 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';

/**
 * For Discord.js
 */
export interface BotOptions {
    token: string;
    owners: string[];
}
