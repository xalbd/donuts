import { Database } from "bun:sqlite";
import type { Record } from "../interfaces/Record";

const db = new Database("data.sqlite", { create: true });

export function createRecord(guildId: string) {
  const query = db.query(`
    INSERT OR IGNORE INTO info(guild)
    VALUES($g)`);
  query.run({ $g: guildId });
}

export function getRecord(guildId: string): Record {
  const query = db.query(`
    SELECT *
    FROM info
    WHERE guild = $g`);

  const res: any = query.get({ $g: guildId });

  return {
    guild: res.guild,
    channel: res.channel,
    users: JSON.parse(res.users) ?? [],
    last_chat: Date.parse(res.last_chat),
  };
}

export function setChannel(guildId: string, channelId: string) {
  const query = db.query(`
    UPDATE info 
    SET channel = $c
    WHERE guild = $g`);
  query.run({ $g: guildId, $c: channelId });
}

export function updateUsers(guildId: string, users: string[]) {
  const query = db.query(`
    UPDATE info
    SET users = $u
    WHERE guild = $g`);
  query.run({ $u: JSON.stringify(users), $g: guildId });
}
