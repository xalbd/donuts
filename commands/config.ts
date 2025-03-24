import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { createRecord, getRecord, setChannel } from "../db/queries";

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Set up Donut Chats")
    .addSubcommand((subcommand) =>
      subcommand.setName("status").setDescription("Show configured options")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Set location to create donut chat threads")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to create threads in")
            .setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("config: guild ID could not be found");
      return;
    }

    switch (interaction.options.getSubcommand()) {
      case "status":
        const config = getRecord(guildId);
        const statusEmbed = new EmbedBuilder()
          .setTitle(`Config for ${interaction.guild?.name}`)
          .addFields(
            { name: "Channel", value: `<#${config.channel}>`, inline: true },
            {
              name: "Users Opted-In",
              value: `${config.users.length}`,
              inline: true,
            }
          );

        await interaction.reply({ embeds: [statusEmbed] });
        break;
      case "channel":
        const channelId = interaction.options.getChannel("channel")?.id;
        if (channelId == null) {
          console.error("config channel: channel ID could not be found");
          return;
        }

        createRecord(guildId);
        setChannel(guildId, channelId);

        const channelEmbed = new EmbedBuilder()
          .setTitle("Channel Set!")
          .setDescription(
            `Donut chat threads will be created in <#${channelId}>!`
          )
          .setColor("Green");
        await interaction.reply({ embeds: [channelEmbed] });
        break;
    }
  },
};
