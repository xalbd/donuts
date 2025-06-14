import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { setPaused } from "../db/queries";

export default {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause automatic donut chats")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("force: guild ID could not be found");
      return;
    }

    setPaused(guildId, true);

    const embed = new EmbedBuilder()
      .setTitle("Donut chats have been paused.")
      .setDescription("Run /start to start them again!")
      .setColor("Blue");
    await interaction.reply({ embeds: [embed] });
  },
};
