import {
  EmbedBuilder,
  Client,
  TextChannel,
  ChannelType,
  DiscordAPIError,
  RESTJSONErrorCodes,
  ThreadAutoArchiveDuration,
} from "discord.js";
import {
  getScheduledServers,
  setCompleted,
  setHistory,
  setNextChat,
  setThreads,
  setUsers,
} from "../db/queries";
import { DateTime } from "luxon";
import type { Record } from "../interfaces/Record";
import { randomIcebreaker } from "./icebreakers";

// Everyone in users who is still in the server. People who left are dropped from the list for good, so they're never
// paired again (their partner would get a thread with no one in it). Any other error keeps them, to be safe.
export async function currentMembers(channel: TextChannel, users: string[]): Promise<string[]> {
  const present: string[] = [];
  for (const user of users) {
    try {
      await channel.guild.members.fetch(user);
      present.push(user);
    } catch (error) {
      const gone =
        error instanceof DiscordAPIError &&
        (error.code === RESTJSONErrorCodes.UnknownMember || error.code === RESTJSONErrorCodes.UnknownUser);
      if (gone) {
        console.log("creating chats: dropping a user who left the server: ", user);
      } else {
        present.push(user);
      }
    }
  }
  return present;
}

export async function startDonutChat(client: Client, r: Record) {
  if (r.channel == null) {
    return;
  }

  // update next chat time and keep track of what threads were used
  if (
    r.next_chat &&
    r.timezone &&
    DateTime.fromISO(r.next_chat, { zone: r.timezone }) < DateTime.now()
  ) {
    let next_schedule = DateTime.fromISO(r.next_chat, {
      zone: r.timezone,
    }).plus({ days: 7 });
    while (DateTime.now().diff(next_schedule).as("days") > 7) {
      next_schedule = next_schedule.plus({ days: 7 });
    }

    setNextChat(r.guild, next_schedule.toISO() ?? "");
  }

  const channel = client.channels.cache.get(r.channel) as TextChannel;

  // send some statistics about last week if anything happened
  if (r.completed.length > 0) {
    const finishedEmbed = new EmbedBuilder()
      .setTitle("Last week's donut chats just ended!")
      .setColor("Blue");

    const porportion = r.completed.length / r.threads.length;
    const finishedMessage =
      porportion < 1 / 3
        ? `Good start! ${r.completed.length} out of ${r.threads.length} donut chats were finished this week. Let's get those numbers up!`
        : porportion < 2 / 3
        ? `${r.completed.length} out of ${r.threads.length} donut chats were finished this week! Keep it up!`
        : `Amazing job! ${r.completed.length} out of ${r.threads.length} donut chats were finished this week!`;

    finishedEmbed.setDescription(finishedMessage);

    channel.send({ embeds: [finishedEmbed] });
  }

  const users = await currentMembers(channel, r.users);
  if (users.length !== r.users.length) {
    setUsers(r.guild, users);
  }

  if (users.length < 2) {
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

  // create a grouping by trying 100 times and picking the best one
  // this is really brute but probably fine for now
  const groups = createHeuristicGrouping(users, r.history, 100);

  const threads: string[] = [];
  for (const group of groups) {
    // create a thread for each group
    const thread = await channel.threads.create({
      name: `Donut Chat - ${DateTime.now().toLocaleString(DateTime.DATE_MED)}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      type: ChannelType.PrivateThread,
    });
    for (const u of group) {
      try {
        await thread.members.add(u);
      } catch {
        console.log(
          "creating chats: some user was unable to be added to a thread: ",
          u
        );
      }
    }
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
          value: randomIcebreaker(),
        },
        {
          name: "We chatted! What do I do?",
          value:
            "Use the /chatted slash command to mark this donut chat as complete!",
        }
      )
      .setFooter({
        text: "Please note that this thread is private but may still be visible to server moderators. Take any private conversations into DMs!",
      })
      .setColor("Blue");
    await thread.send({ embeds: [introductionEmbed] });
  }

  setThreads(r.guild, threads);
  setCompleted(r.guild, []);

  // update history with the new groups
  const newHistory = r.history;
  newHistory.push(groups);
  setHistory(r.guild, newHistory);
}

export async function startScheduledDonutChats(client: Client) {
  const scheduled = getScheduledServers();
  scheduled.forEach(async (r) => {
    await startDonutChat(client, r);
  });
}

function createHeuristicGrouping(
  u: string[],
  prevMatching: string[][][],
  tries: number
): string[][] {
  let score: number = Number.MAX_SAFE_INTEGER;
  let bestGroups: string[][] = [];

  for (let i = 0; i < tries; i++) {
    const groups = createGrouping(u);
    const newScore = calculateGroupingScore(prevMatching, groups);
    if (newScore < score) {
      score = newScore;
      bestGroups = groups;
    }

    if (newScore == 0) {
      break; // if we find a perfect grouping, we can stop early
    }
  }

  return bestGroups;
}

function createGrouping(u: string[]): string[][] {
  const users = u.sort(() => Math.random() - 0.5);
  const groups = [];
  for (let i = 0; i < users.length - 1; i += 2) {
    groups.push(users.slice(i, i + 2));
  }
  if (users.length % 2 != 0) {
    groups[groups.length - 1].push(users[users.length - 1]);
  }

  return groups;
}

function calculateGroupingScore(
  prevMatching: string[][][],
  proposed: string[][]
): number {
  let score = 0;
  prevMatching.forEach((week, i) => {
    week.forEach((prevGroup) => {
      proposed.forEach((proposedGroup) => {
        // check if all users in the proposed group were in the previous group
        if (proposedGroup.every((user) => prevGroup.includes(user))) {
          // if so, add the age weighting to the score
          const weeksAgo = prevMatching.length - i;
          score += getAgeWeighting(weeksAgo);
        }
      });
    });
  });

  return score;
}

function getAgeWeighting(weeksAgo: number): number {
  // 1^1.3 in order to weigh closer chats more
  return weeksAgo ** -1.3;
}
