import { Database } from "bun:sqlite";
import type { Record } from "../interfaces/Record";

const db = new Database("data.sqlite", { create: true });

export function createRecord(guildId: string) {
  const query = db.query(`
    INSERT OR IGNORE INTO info(guild)
    VALUES($g)`);
  query.run({ $g: guildId });
}

export function parseRecord(res: any): Record {
  return {
    guild: res.guild,
    channel: res.channel,
    users: JSON.parse(res.users) ?? [],
    timezone: res.timezone,
    next_chat: res.next_chat,
    offset: res.number,
    threads: JSON.parse(res.threads) ?? [],
  };
}

export function getRecord(guildId: string): Record {
  const query = db.query(`
    SELECT *
    FROM info
    WHERE guild = $g`);

  const res = query.get({ $g: guildId });
  return parseRecord(res);
}

export function setChannel(guildId: string, channelId: string) {
  const query = db.query(`
    UPDATE info 
    SET channel = $c
    WHERE guild = $g`);
  query.run({ $g: guildId, $c: channelId });
}

export function setUsers(guildId: string, users: string[]) {
  const query = db.query(`
    UPDATE info
    SET users = $u
    WHERE guild = $g`);
  query.run({ $u: JSON.stringify(users), $g: guildId });
}

export function setTimezone(guildId: string, timezone: string) {
  const query = db.query(`
    UPDATE info
    SET timezone = $t
    WHERE guild = $g`);
  query.run({ $t: timezone, $g: guildId });
}

export function setNextChat(guildId: string, nextChat: string) {
  const query = db.query(`
    UPDATE info
    SET next_chat = $n
    WHERE guild = $g`);
  query.run({ $n: nextChat, $g: guildId });
}

export function incrementOffset(guildId: string) {
  const query = db.query(`
    UPDATE info
    SET offset = offset + 1
    WHERE guild = $g`);
  query.run({ $g: guildId });
}

export function setThreads(guildId: string, threads: string[]) {
  const query = db.query(`
    UPDATE info
    SET threads = $t
    WHERE guild = $g`);
  query.run({ $t: JSON.stringify(threads), $g: guildId });
}

export function getScheduledServers(): Record[] {
  const query = db.query(`
    SELECT * 
    FROM info
    WHERE next_chat IS NOT NULL AND channel IS NOT NULL
      AND unixepoch() > unixepoch(next_chat)`);

  const res = query.all();
  return res.map((x: any) => parseRecord(x));
}
