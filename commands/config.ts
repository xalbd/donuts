import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getRecord, setChannel, setNextChat, setTimezone } from "../db/queries";
import { DateTime } from "luxon";

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Set up Donut Chats")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
        .addIntegerOption((option) =>
          option
            .setName("day")
            .setDescription("Day of the week to send donut chats out")
            .setRequired(true)
            .addChoices(
              { name: "Monday", value: 1 },
              { name: "Tuesday", value: 2 },
              { name: "Wednesday", value: 3 },
              { name: "Thursday", value: 4 },
              { name: "Friday", value: 5 },
              { name: "Saturday", value: 6 },
              { name: "Sunday", value: 7 }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("hour")
            .setDescription(
              "Hour of the day (24hr format) to send donut chats out"
            )
            .setMinValue(0)
            .setMaxValue(23)
        )
        .addIntegerOption((option) =>
          option
            .setName("minute")
            .setDescription("Minute of the hour to send donut chats out")
            .setMinValue(0)
            .setMaxValue(59)
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
            .setTitle("Time zone could not be parsed.")
            .setDescription(
              "Provided time zone is required to be in IANA format. You can look up your time zone up using [this tool](https://zones.arilyn.cc/)."
            )
            .setColor("Red");
          await interaction.reply({ embeds: [timezoneFailureEmbed] });
        } else {
          const tzIANA = testTZ.zone.name;
          setTimezone(guildId, tzIANA);
          const timezoneSuccessEmbed = new EmbedBuilder()
            .setTitle(`The donut chat time zone was changed to ${tzIANA}!`)
            .setColor("Green");
          await interaction.reply({ embeds: [timezoneSuccessEmbed] });
        }
        break;
      case "schedule":
        if (config.timezone == null || config.channel == null) {
          const notConfiguredEmbed = new EmbedBuilder()
            .setTitle("Please configure the channel and time zone first.")
            .setDescription(
              "The bot needs to know the appropriate time zone to schedule donut chats for as well as where to put the donut chats. Use the /config timezone and /config channel commands to configure these two settings respectively."
            )
            .setColor("Red");
          await interaction.reply({ embeds: [notConfiguredEmbed] });
        } else {
          const day = interaction.options.getInteger("day");
          const hour = interaction.options.getInteger("hour") ?? 9;
          const minute = interaction.options.getInteger("minute") ?? 0;

          let desired = DateTime.local({ zone: config.timezone });
          desired = desired.set({
            hour: hour,
            minute: minute,
          });
          while (desired < DateTime.now() || desired.weekday != day) {
            desired = desired.plus({ days: 1 });
          }

          setNextChat(guildId, desired.toISO());

          const scheduleEmbed = new EmbedBuilder()
            .setTitle("Donut chats are happening!")
            .setDescription(
              `Weekly donut chats are beginning, starting on ${desired.toLocaleString(
                DateTime.DATETIME_MED
              )}!`
            )
            .setFooter({
              text: "You can start this week's early by using the /force command as an Administrator",
            })
            .setColor("Green");

          await interaction.reply({ embeds: [scheduleEmbed] });
        }
        break;
    }
  },
};
