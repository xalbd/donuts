import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getRecord, setUsers } from "../db/queries";

export default {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Opt yourself out of donut chats."),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId == null) {
      console.error("leave: guild ID could not be found");
      return;
    }

    const embed = new EmbedBuilder();

    const users = getRecord(guildId).users;
    if (users.includes(interaction.user.id)) {
      setUsers(
        guildId,
        users.filter((x) => x != interaction.user.id)
      );

      embed.setTitle(`You've left donut chats successfully.`);
    } else {
      embed.setTitle(
        "Leaving donut chats failed because you aren't opted in right now."
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
