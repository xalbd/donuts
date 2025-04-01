import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getRecord, setCompleted } from "../db/queries";

export default {
  data: new SlashCommandBuilder()
    .setName("chatted")
    .setDescription("Use in a donut chat thread to mark it as finished!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("chatted: guild ID could not be found");
      return;
    }

    const embed = new EmbedBuilder();

    const record = getRecord(guildId);
    if (!record.threads.includes(interaction.channelId)) {
      embed
        .setTitle(
          "This donut chat is not active and cannot be marked as finished."
        )
        .setColor("Red");
    } else {
      if (!record.completed.includes(interaction.channelId)) {
        record.completed.push(interaction.channelId);
        setCompleted(guildId, record.completed);
      }

      embed
        .setTitle("This donut chat has been completed!")
        .setDescription(":tada: :tada:")
        .setColor("Green");
    }

    await interaction.reply({ embeds: [embed] });
  },
};
