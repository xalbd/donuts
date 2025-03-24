import { Client, Events } from "discord.js";
import deploy from "../util/deploy";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`Client ready and logged in as ${client.user?.tag}`);
    deploy(client);
  },
};
