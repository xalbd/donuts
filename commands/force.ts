import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
  Client,
} from "discord.js";
import { getRecord } from "../db/queries";
import { startDonutChat } from "../util/donut";

export default {
  data: new SlashCommandBuilder()
    .setName("force")
    .setDescription("Force the bot to create a new donut chat")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.guildId == null) {
      console.error("force: guild ID could not be found");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Forcing a new donut chat")
      .setDescription(
        "A new donut chat is being created right now! Note that this does not change the schedule for future donut chats. Use /config schedule with the Administrator role to change the schedule."
      )
      .setColor("Blue");
    await interaction.reply({ embeds: [embed] });

    await startDonutChat(interaction.client, getRecord(interaction.guildId));
  },
};
