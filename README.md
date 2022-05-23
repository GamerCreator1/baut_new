# BuilderBaut

New and Improved BuilderBaut

Config files go in `.env` and `.env.dev`, example is shown at `.env.example`.

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
import { Message } from 'discord.js';

import Command from '../../structures/Command';
import DiscordClient from '../../structures/DiscordClient';

export default class ExampleCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'example',
            group: 'Developer',
            description: 'An example command.',
            require: {
                developer: true
            }
        });
    }

    async run(message: Message, args: string[]) {
        await message.reply('Wow, example command working!');
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
