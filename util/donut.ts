import {
  EmbedBuilder,
  Client,
  TextChannel,
  ChannelType,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { getScheduledServers, setNextChat, setThreads } from "../db/queries";
import { DateTime } from "luxon";
import type { Record } from "../interfaces/Record";

export async function startDonutChat(client: Client, r: Record) {
  if (r.channel == null) {
    return;
  }

  const channel = client.channels.cache.get(r.channel) as TextChannel;
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

  // pair people up randomly with a group of 3 if necessary
  // note: this has a really high chance of pairing the same people up multiple times in a row
  const users = r.users.sort(() => Math.random() - 0.5);
  const groups = [];
  for (let i = 0; i < users.length - 1; i += 2) {
    groups.push(users.slice(i, i + 2));
  }
  if (groups.length % 2 != 0) {
    groups[groups.length - 1].push(users[users.length - 1]);
  }

  const threads: string[] = [];
  groups.forEach(async (group) => {
    // create a thread for each group
    const thread = await channel.threads.create({
      name: `Donut Chat - ${DateTime.now().toLocaleString(DateTime.DATE_MED)}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      type: ChannelType.PrivateThread,
    });
    group.forEach(async (u) => {
      try {
        await thread.members.add(u);
      } catch {
        console.log(
          "creating chats: some user was unable to be added to a thread: ",
          u
        );
      }
    });
    threads.push(thread.id);
    await thread.join();

    const pings = group.map((u) => `<@${u}>`);
    const pingString =
      pings.slice(0, group.length - 1).join(", ") +
      " and " +
      pings[group.length - 1];

    const introductionEmbed = new EmbedBuilder()
      .setTitle("Let's donut!")
      .setDescription(`Welcome, ${pingString}! :doughnut: :speaking_head:`)
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
  });

  // update next chat time and keep track of what threads were used
  setNextChat(
    r.guild,
    DateTime.fromISO(r.next_chat, { zone: r.timezone })
      .plus({ days: 7 })
      .toISO() ?? ""
  );
  setThreads(r.guild, threads);
}

export async function startScheduledDonutChats(client: Client) {
  const scheduled = getScheduledServers();
  scheduled.forEach(async (r) => {
    await startDonutChat(client, r);
  });
}
