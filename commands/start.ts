import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { setPaused } from "../db/queries";

export default {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start automatic donut chats again")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("force: guild ID could not be found");
      return;
    }

    setPaused(guildId, false);

    const embed = new EmbedBuilder()
      .setTitle("Donut chats will automatically start again!")
      .setColor("Green");
    await interaction.reply({ embeds: [embed] });
  },
};
