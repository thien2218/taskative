import { Kysely, CamelCasePlugin } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { DB } from "./types";

export function createDatabase(db: D1Database): Kysely<DB> {
  return new Kysely<DB>({
    dialect: new D1Dialect({ database: db }),
    plugins: [new CamelCasePlugin()],
  });
}
