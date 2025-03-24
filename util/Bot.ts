import { Client, Collection, GatewayIntentBits } from "discord.js";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import type { Command } from "../interfaces/Command";

export default class Bot {
  private client = new Client({ intents: [GatewayIntentBits.Guilds] });
  private commands = new Collection<string, Command>();

  public constructor() {
    this.initHandlers();
    this.client.login(process.env.DISCORD_TOKEN);
  }

  private async initHandlers() {
    const commandsPath = join(__dirname, "..", "commands");
    const commandFiles = readdirSync(commandsPath);
    for (const file of commandFiles) {
      const command = await import(join(commandsPath, file));
      this.commands.set(command.default.data.name, command.default);
    }

    const eventsPath = join(__dirname, "..", "events");
    const eventFiles = readdirSync(eventsPath);
    for (const file of eventFiles) {
      const event = await import(join(eventsPath, file));
      if (event.default.once) {
        this.client.once(event.default.name, (...args) =>
          event.default.execute(...args)
        );
      } else {
        this.client.on(event.default.name, (...args) =>
          event.default.execute(this.commands, ...args)
        );
      }
    }
  }
}
