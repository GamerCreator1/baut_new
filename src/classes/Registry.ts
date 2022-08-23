import { Routes } from "discord-api-types/v9";
import { Collection, Colors } from "discord.js";
import path from "path";
import requireAll from "require-all";

import Logger from "@classes/Logger";
import { REST } from "@discordjs/rest";
import RegistryError from "@errors/RegistryError";
import Command from "@structures/Command";
import DiscordClient from "@structures/DiscordClient";
import Embed from "@structures/Embed";
import Event from "@structures/Event";
import { isConstructor } from "@utils/functions";

export default class Registry {
    /**
     * Discord client.
     */
    private client: DiscordClient;

    /**
     * Collection for command registration.
     */
    private commands: Collection<string, Command>;

    /**
     * Command paths
     */
    private commandPaths: string[] = [];

    /**
     * Collection for event registration.
     */
    private events: Collection<string, Event>;

    /**
     * Event paths
     */
    private eventPaths: string[] = [];

    /**
     * Collection for command cooldown registration.
     */
    private cooldowns: Collection<string, Collection<string, number>>;

    /**
     * Collection for command group registration.
     */
    private groups: Collection<string, string[]>;

    /**
     * Collection for command autocomplete options.
     */
    private autocomplete: Collection<string, () => { name: string; value: string }[]>;

    /**
     * Any hardcoded embeds
     */
    private embeds: Collection<string, Embed>;

    /**
     * Embed paths
     */
    private embedPaths: string[] = [];

    /**
     * Creates instance for all collections.
     */
    private newCollections() {
        this.commands = new Collection<string, Command>();
        this.events = new Collection<string, Event>();
        this.cooldowns = new Collection<string, Collection<string, number>>();
        this.groups = new Collection<string, string[]>();
        this.autocomplete = new Collection<string, () => { name: string; value: string }[]>();
        this.embeds = new Collection<string, Embed>();
    }

    constructor(client: DiscordClient) {
        this.client = client;
        this.newCollections();
    }

    /**
     * Registers single event.
     * @param event Event object
     */
    private registerEvent(event: Event) {
        if (this.events.some(e => e.name === event.name)) throw new RegistryError(`A event with the name "${event.name}" is already registered.`);

        this.events.set(event.name, event);
        this.client.on(event.name, event.run.bind(event));
        Logger.log("INFO", `Event "${event.name}" loaded.`);
    }

    /**
     * Registers all events.
     */
    private registerAllEvents() {
        const events: any[] = [];

        if (this.eventPaths.length)
            this.eventPaths.forEach(p => {
                delete require.cache[p];
            });

        requireAll({
            dirname: path.join(__dirname, "../events"),
            recursive: true,
            filter: /\w*.[tj]s/g,
            resolve: x => events.push(x),
            map: (name, filePath) => {
                if (filePath.endsWith(".ts") || filePath.endsWith(".js")) this.eventPaths.push(path.resolve(filePath));
                return name;
            },
        });

        for (let event of events) {
            const valid = isConstructor(event, Event) || isConstructor(event.default, Event) || event instanceof Event || event.default instanceof Event;
            if (!valid) continue;

            if (isConstructor(event, Event)) event = new event(this.client);
            else if (isConstructor(event.default, Event)) event = new event.default(this.client);
            if (!(event instanceof Event)) throw new RegistryError(`Invalid event object to register: ${event}`);

            this.registerEvent(event);
        }
    }

    /**
     * Registers single command.
     * @param command Command object
     */
    private registerCommand(command: Command) {
        if (
            this.commands.some(x => {
                if (x.data.name === command.data.name) return true;
                else return false;
            })
        )
            throw new RegistryError(`A command with the name/alias "${command.data.name}" is already registered.`);

        this.commands.set(command.data.name, command);
        if (!this.groups.has(command.info.group)) this.groups.set(command.info.group, [command.data.name]);
        else {
            const groups = this.groups.get(command.info.group) as string[];
            groups.push(command.data.name);
            this.groups.set(command.info.group, groups);
        }
        if (command.info.autocomplete) {
            this.autocomplete.set(command.data.name, command.info.autocomplete);
        }
        Logger.log("INFO", `Command "${command.data.name}" loaded.`);
    }

    /**
     * Registers all commands.
     */
    private registerAllCommands() {
        const commands: any[] = [];

        if (this.commandPaths.length)
            this.commandPaths.forEach(p => {
                delete require.cache[p];
            });

        requireAll({
            dirname: path.join(__dirname, "../commands"),
            recursive: true,
            filter: /\w*.[tj]s/g,
            resolve: x => commands.push(x),
            map: (name, filePath) => {
                if (filePath.endsWith(".ts") || filePath.endsWith(".js")) this.commandPaths.push(path.resolve(filePath));
                return name;
            },
        });

        for (let command of commands) {
            const valid = isConstructor(command, Command) || isConstructor(command.default, Command) || command instanceof Command || command.default instanceof Command;
            if (!valid) continue;

            if (isConstructor(command, Command)) command = new command(this.client);
            else if (isConstructor(command.default, Command)) command = new command.default(this.client);
            if (!(command instanceof Command)) throw new RegistryError(`Invalid command object to register: ${command}`);

            this.registerCommand(command);
        }
    }

    /**
     * Registers embeds from embeds directory
     */
    private async registerAllEmbeds() {
        const embeds: any[] = [];

        if (this.embedPaths.length)
            this.embedPaths.forEach(p => {
                delete require.cache[p];
            });

        requireAll({
            dirname: path.join(__dirname, "../embeds"),
            recursive: true,
            filter: /\w*.[tj]s/g,
            resolve: x => embeds.push(x),
            map: (name, filePath) => {
                if (filePath.endsWith(".ts") || filePath.endsWith(".js")) this.embedPaths.push(path.resolve(filePath));
                return name;
            },
        });

        for (let embed of embeds) {
            const valid = isConstructor(embed, Embed) || isConstructor(embed.default, Embed) || embed instanceof Embed || embed.default instanceof Embed;
            if (!valid) continue;

            if (isConstructor(embed, Embed)) embed = new embed(this.client);
            else if (isConstructor(embed.default, Embed)) embed = new embed.default(this.client);
            if (!(embed instanceof Embed)) throw new RegistryError(`Invalid embed object to register: ${embed}`);

            if (!embed.hideFromClient) this.embeds.set(embed.name, embed);
        }

        Logger.log("INFO", `${this.embeds.size} embeds loaded.`);
    }
    /**
     * Finds and returns the command by name.
     * @param command Name
     */
    findCommand(command: string): Command | undefined {
        return this.commands.get(command);
    }

    /**
     * Finds and returns the commands in group by group name
     * @param group Name of group
     */
    findCommandsInGroup(group: string): string[] | undefined {
        return this.groups.get(group);
    }

    /**
     * Returns all group names.
     */
    getAllGroupNames() {
        return [...this.groups.keys()];
    }

    /**
     * Returns timestamps of the command.
     * @param commandName Name of the command
     */
    getCooldownTimestamps(commandName: string): Collection<string, number> {
        if (!this.cooldowns.has(commandName)) this.cooldowns.set(commandName, new Collection<string, number>());
        return this.cooldowns.get(commandName) as Collection<string, number>;
    }

    /**
     * Register slash commands
     */
    registerGuildSlashCommands() {
        const rest = new REST({ version: "9" }).setToken(this.client.token);
        (async () => {
            try {
                await rest.put(Routes.applicationGuildCommands(this.client.config.clientId, this.client.config.guildId) as unknown as `/{string}`, {
                    body: this.commands.map(command => command.data.toJSON()),
                });

                Logger.log("INFO", `Loaded ${this.commands.size} application (/) commands.`);
            } catch (error) {
                if (error instanceof Error) {
                    Logger.log("ERROR", error.stack as string);
                }
            }
        })();
    }

    /**
     * Get all command names
     */
    getAllCommandNames() {
        return [...this.commands.keys()];
    }

    /**
     * Registers events and commands.
     */
    registerAll() {
        this.registerAllEmbeds();
        this.registerAllCommands();
        this.registerAllEvents();
        this.registerGuildSlashCommands();
    }

    /**
     * Removes all events from client then reregisters events & commands. Resets groups and cooldowns.
     *
     * Call this function while client is offline.
     */
    reregisterAll() {
        const allEvents = [...this.events.keys()];
        allEvents.forEach(event => this.client.removeAllListeners(event));
        this.newCollections();
        this.registerAll();
    }

    /**
     * Returns the autocomplete object.
     */
    getAutocomplete() {
        return this.autocomplete;
    }

    /**
     * Returns embeds
     */
    getEmbeds() {
        return this.embeds;
    }
}
