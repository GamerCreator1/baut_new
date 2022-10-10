import { ContextMenuCommandBuilder, ContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import DiscordClient from "./DiscordClient";

export default abstract class ContextMenu {
    readonly name: string;

    readonly type: "USER" | "MESSAGE";

    readonly data: ContextMenuCommandBuilder;

    constructor(name: string, type: "USER" | "MESSAGE") {
        this.name = name;
        this.type = type;
        this.data = new ContextMenuCommandBuilder().setName(name).setType(type === "USER" ? ApplicationCommandType.User : ApplicationCommandType.Message);
    }

    abstract onInteraction(interaction: ContextMenuCommandInteraction, client: DiscordClient): Promise<void>;
}
