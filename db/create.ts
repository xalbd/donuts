import { Database } from "bun:sqlite";

const db = new Database("data.sqlite", { create: true });

const create = db.query(
  `CREATE TABLE IF NOT EXISTS info (
   guild TEXT PRIMARY KEY,
   channel TEXT,
   users TEXT NOT NULL DEFAULT "[]",
   timezone TEXT, 
   next_chat TEXT,
   threads TEXT NOT NULL DEFAULT "[]",
   completed TEXT NOT NULL DEFAULT "[]",
   history TEXT NOT NULL DEFAULT "[]");`
);
create.run();
