import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("ping").setDescription("pong!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("Pong!")
      .setDescription(
        `Latency: ${Date.now() - interaction.createdTimestamp}ms`
      );
    await interaction.reply({ embeds: [embed] });
  },
};
