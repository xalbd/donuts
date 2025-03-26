import { Database } from "bun:sqlite";

const db = new Database("data.sqlite", { create: true });

const create = db.query(
  `CREATE TABLE IF NOT EXISTS info (
   guild TEXT PRIMARY KEY,
   channel TEXT,
   users TEXT NOT NULL DEFAULT "[]",
   timezone TEXT, 
   next_chat TEXT,
   offset INTEGER NOT NULL DEFAULT 1,
   threads TEXT NOT NULL DEFAULT "[]");`
);
create.run();
