import { Collection, Events, Guild } from "discord.js";
import { createRecord } from "../db/queries";

export default {
  name: Events.GuildCreate,
  async execute(commands: Collection<string, any>, guild: Guild) {
    if (guild.id == null) {
      console.error("Added to guild but could not locate guild ID.");
      return;
    }
    createRecord(guild.id);
  },
};
