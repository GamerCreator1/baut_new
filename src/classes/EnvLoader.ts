import dotenv from "dotenv";

import EnvError from "@errors/EnvError";

export default class EnvLoader {
    /** Loads and validates .env file. */
    static load() {
        dotenv.config();
        this.validate(process.env);
    }

    /**
     * Validates the .env file.
     * @param env Env object
     */
    private static validate(env: any) {
        if (env.TOKEN === "") throw new EnvError("Discord token missing.");
        if (env.DEVELOPERS === "") throw new EnvError("Developers missing.");

        if (env.UNKNOWN_COMMAND_ERROR === "") throw new EnvError("Unknown command error missing");
        if (!["true", "false"].includes(env.UNKNOWN_COMMAND_ERROR)) throw new EnvError("Unknown command error must be typeof boolean.");
    }
}
