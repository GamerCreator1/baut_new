# BuilderBaut

New and Improved BuilderBaut

Config files go in `.env`, example is shown at `.env.example`.

## ❗ Important Files

-   `/src/classes/CommandHandler.ts`: Command handler with error handling
-   `/src/classes/Registry.ts`: Auto command + event registration
-   `/src/structures/DiscordClient.ts`: Custom Discord client

## 🛠️ Creating Commands & Events

### Commands

-   Create a new file to `src/commands`. (You can create files in directories)
-   Open your file.
-   Add command template.

```ts
import { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import Command from '../../structures/Command';
import DiscordClient from '../../structures/DiscordClient';

export default class ExampleCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'Developer',
                require: {
                    developer: true
                }
            },
            new SlashCommandBuilder().setName('example').setDescription('An example command.')
        );
    }

    async run(command: CommandInteraction) {
        await command.reply('Wow, example command working!');
    }
}
```

### Events

-   Create a new file to `src/events`. (You can create files in directories)
-   Open your file.
-   Add event template.

```ts
import { GuildMember } from 'discord.js';

import DiscordClient from '../structures/DiscordClient';
import Event from '../structures/Event';

export default class GuildMemberAddEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'guildMemberAdd');
    }

    async run(member: GuildMember) {
        console.log(`${member.user.tag} joined to ${member.guild.name}.`);
    }
}
```

You can check event parameters from [discord.js.org](https://discord.js.org/#/docs/main/stable/class/Client).

---
