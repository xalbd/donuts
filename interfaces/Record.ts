export interface Record {
  guild: string;
  channel: string | null;
  users: string[];
  timezone: string | null; // IANA timezone
  next_chat: string | null; // Next donut chat time stored in ISO 8601; increments by a week at a time
  threads: string[];
  completed: string[];
  history: string[][][]; // participants per group; groups per week
  paused: number;
}
