import { Client, Events } from "discord.js";
import deploy from "../util/deploy";
import { startScheduledDonutChats } from "../util/donut";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`Client ready and logged in as ${client.user?.tag}`);
    deploy(client);

    setInterval(() => {
      startScheduledDonutChats(client);
    }, 60 * 1000); // just do a dumb check every 60 seconds
  },
};
