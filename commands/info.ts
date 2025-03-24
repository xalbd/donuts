import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getRecord } from "../db/queries";

export default {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get information about donut chat configuration"),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("config: guild ID could not be found");
      return;
    }

    const config = getRecord(guildId);
    const statusEmbed = new EmbedBuilder()
      .setTitle(`Config for ${interaction.guild?.name}`)
      .setDescription(
        config.active
          ? "There is a donut chat happening right now!"
          : "There is no active donut chat."
      )
      .addFields(
        {
          name: "Channel",
          value: config.channel
            ? `<#${config.channel}>`
            : "N/A, configure using /config channel",
          inline: true,
        },
        {
          name: "Users Joined",
          value: `${config.users.length}`,
          inline: true,
        },
        { name: "Timezone", value: config.timezone },
        {
          name: "Next Donut Chat",
          value: config.next_chat
            ? `${new Date(config.next_chat).toLocaleDateString()}`
            : "N/A, configure using /config schedule",
        }
      )
      .setFooter({
        text: "Note: only users with the Administrator role have access to config commands",
      })
      .setColor("Blue");

    await interaction.reply({ embeds: [statusEmbed] });
  },
};
