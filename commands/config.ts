import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getRecord, setChannel, setTimezone } from "../db/queries";
import { DateTime } from "luxon";

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Set up Donut Chats")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Set location to create donut chat threads")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("timezone")
        .setDescription("Set bot's timezone for scheduling")
        .addStringOption((option) =>
          option
            .setName("timezone")
            .setDescription("Timezone in IANA (tzdb) format")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("schedule")
        .setDescription(
          "Set the time and day of the week donut chats are started"
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("config: guild ID could not be found");
      return;
    }

    const config = getRecord(guildId);
    switch (interaction.options.getSubcommand()) {
      case "channel":
        const channelEmbed = new EmbedBuilder()
          .setTitle("Donut chat channel configuration")
          .setDescription(
            "Select the channel where donut chat threads will be created. The bot must be able to send messages and create private threads in the selected channel."
          )
          .setColor("Blue");

        const channelSelect = new ChannelSelectMenuBuilder()
          .setChannelTypes(ChannelType.GuildText)
          .setCustomId("channelSelect")
          .setPlaceholder("Select where to create donut chat threads");

        if (config.channel) {
          channelSelect.setDefaultChannels(config.channel);
        }

        const row =
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            channelSelect
          );

        const response = await interaction.reply({
          embeds: [channelEmbed],
          components: [row],
          withResponse: true,
        });

        try {
          const confirmation =
            await response.resource?.message?.awaitMessageComponent({
              time: 30_000,
            });

          if (confirmation?.channelId) {
            setChannel(guildId, confirmation.channelId);

            const channelSuccessEmbed = new EmbedBuilder()
              .setTitle(
                `The donut chat channel was changed to <#${confirmation.channelId}>!`
              )
              .setColor("Green");

            await confirmation.update({
              embeds: [channelSuccessEmbed],
              components: [],
            });
          }
        } catch {
          const newConfig = getRecord(guildId);
          const channelFailureEmbed = new EmbedBuilder();
          if (newConfig.channel) {
            channelFailureEmbed.setTitle(
              `The donut chat channel was not changed from <#${newConfig.channel}>.`
            );
          } else {
            channelFailureEmbed
              .setTitle(
                "No channel was selected within 30 seconds; cancelling."
              )
              .setColor("Red");
          }

          await interaction.editReply({
            embeds: [channelFailureEmbed],
            components: [],
          });
        }
        break;
      case "timezone":
        const tz = interaction.options.getString("timezone") ?? "";
        const testTZ = DateTime.local().setZone(tz);

        if (!testTZ.isValid) {
          const timezoneFailureEmbed = new EmbedBuilder()
            .setTitle("Timezone could not be parsed.")
            .setDescription(
              "Provided timezone is required to be in IANA format. You can look up your timezone up using [this tool](https://zones.arilyn.cc/)."
            )
            .setColor("Red");
          await interaction.reply({ embeds: [timezoneFailureEmbed] });
        } else {
          const tzIANA = testTZ.zone.name;
          setTimezone(guildId, tzIANA);
          const timezoneSuccessEmbed = new EmbedBuilder()
            .setTitle(`The donut chat timezone was changed to ${tzIANA}!`)
            .setColor("Green");
          await interaction.reply({ embeds: [timezoneSuccessEmbed] });
        }
        break;
    }
  },
};
