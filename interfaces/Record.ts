export interface Record {
  guild: string;
  channel: string;
  users: string[];
  timezone: string; // IANA timezone
  next_chat: string; // Next donut chat time stored in ISO 8601; increments by a week at a time
  threads: string[];
}
