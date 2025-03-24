import { Client, REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export default async function deploy(client: Client) {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? "");

  const commandsPath = join(__dirname, "..", "commands");
  const commandFiles = readdirSync(commandsPath);
  const commands = [];

  for (const file of commandFiles) {
    const command = await import(join(commandsPath, file));
    commands.push(command.default.data);
  }

  try {
    await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commands,
    });
  } catch (error) {
    console.error(error);
  }
}
