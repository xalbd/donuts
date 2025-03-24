import { Collection, CommandInteraction, Events } from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(
    commands: Collection<string, any>,
    interaction: CommandInteraction
  ) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
    }
  },
};
