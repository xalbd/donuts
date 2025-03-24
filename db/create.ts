import { Database } from "bun:sqlite";

const db = new Database("data.sqlite", { create: true });

const create = db.query(
  `CREATE TABLE IF NOT EXISTS info (
   guild TEXT PRIMARY KEY,
   channel TEXT,
   users TEXT NOT NULL DEFAULT "[]",
   last_chat TEXT);`
);
create.run();
