import {
  EmbedBuilder,
  Client,
  TextChannel,
  ChannelType,
  ThreadAutoArchiveDuration,
} from "discord.js";
import {
  getScheduledServers,
  incrementOffset,
  setNextChat,
  setThreads,
} from "../db/queries";
import { DateTime } from "luxon";

export async function createChats(client: Client) {
  const threads: string[] = [];
  const scheduled = getScheduledServers();
  scheduled.forEach(async (r) => {
    if (r.channel == null) {
      return;
    }

    const channel = (await client.channels.cache.get(r.channel)) as TextChannel;
    if (r.users.length < 1) {
      const notEnoughEmbed = new EmbedBuilder()
        .setTitle("A donut chat was scheduled but not enough people joined.")
        .setDescription(
          "There needs to be at least 2 people to chat with each other!"
        )
        .setColor("Red");

      channel.send({ embeds: [notEnoughEmbed] });
      return;
    } else {
      const enoughEmbed = new EmbedBuilder()
        .setTitle("A donut chat was just started!")
        .setDescription(
          "If you're signed up, check for a ping in a thread in this channel! :doughnut:"
        )
        .addFields({
          name: "I wasn't pinged!",
          value:
            "Make sure you've joined already! You can do this with the /join slash command.",
        })
        .setFooter({
          text: "You can always opt-out with /leave, but we'll be sad to see you go!",
        })
        .setColor("Green");
      channel.send({ embeds: [enoughEmbed] });
    }

    // assign people based off of current offset and create threads
    // NOTE: this algorithm does not work at all at the moment
    for (let i = 0; i < r.users.length; i++) {
      const j = (i + r.offset) % r.users.length;

      const thread = await channel.threads.create({
        name: `Donut Chat - ${DateTime.now().toLocaleString(
          DateTime.DATE_MED
        )}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        type: ChannelType.PrivateThread,
      });
      threads.push(thread.id);
      try {
        thread.members.add(r.users[i]);
        thread.members.add(r.users[j]);
      } catch {
        console.log(
          "creating chats: some user was unable to be added to a thread"
        );
      }
      await thread.join();

      const introductionEmbed = new EmbedBuilder()
        .setTitle("Let's donut!")
        .setDescription(
          `Welcome, <@${r.users[i]}> and <@${r.users[j]}>! :doughnut: :speaking_head:`
        )
        .addFields(
          {
            name: "How does this work?",
            value:
              "Introduce yourselves and grab some coffee or food together sometime soon. I'll check up to see how it's going before the week ends!",
          },
          {
            name: "What should we talk about?",
            value: "Insert icebreaker here...",
          }
        )
        .setFooter({
          text: "Please note that this thread is private but may still be visible to server moderators. Take any private conversations into DMs!",
        })
        .setColor("Blue");
      await thread.send({ embeds: [introductionEmbed] });
    }

    // update offset/next chat time and keep track of what threads were used
    incrementOffset(r.guild);
    setNextChat(
      r.guild,
      DateTime.fromISO(r.next_chat, { zone: r.timezone })
        .plus({ days: 7 })
        .toISO() ?? ""
    );
    setThreads(r.guild, threads);
  });
}
