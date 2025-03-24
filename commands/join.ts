import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getRecord, updateUsers } from "../db/queries";

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Opt yourself in for donut chats!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("join: guild ID could not be found");
      return;
    }

    const embed = new EmbedBuilder();

    const users = getRecord(guildId).users;
    if (!users.includes(interaction.user.id)) {
      users.push(interaction.user.id);
      updateUsers(guildId, users);

      embed
        .setTitle(
          `${interaction.user.displayName} has just joined donut chats!`
        )
        .setDescription(":tada: :doughnut:")
        .setColor("Green");
    } else {
      embed.setTitle("You've already joined donut chats!");
    }

    await interaction.reply({ embeds: [embed] });
  },
};
