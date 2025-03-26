import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { createRecord, getRecord } from "../db/queries";
import { DateTime } from "luxon";

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
    createRecord(guildId); // create record in database just to be safe

    const config = getRecord(guildId);
    const statusEmbed = new EmbedBuilder()
      .setTitle(`Config for ${interaction.guild?.name}`)
      .setDescription(
        config.threads.length > 0
          ? "There is a donut chat happening right now!"
          : config.channel && config.timezone && config.next_chat
          ? "There is no active donut chat."
          : "Donut chats are not ready to begin. Please ensure that all settings listed below are configured."
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
        {
          name: "Time zone",
          value: config.timezone ?? "N/A, configure using /config timezone",
        },
        {
          name: "Next Scheduled Donut Chat",
          value: config.timezone
            ? config.next_chat
              ? `${DateTime.fromISO(config.next_chat, {
                  zone: config.timezone,
                }).toLocaleString(DateTime.DATETIME_MED)}`
              : "N/A, configure using /config schedule"
            : "Please configure the time zone using /config timezone first.",
        }
      )
      .setFooter({
        text: "Note: only users with the Administrator role have access to config commands",
      })
      .setColor("Blue");

    await interaction.reply({ embeds: [statusEmbed] });
  },
};
