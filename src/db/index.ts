import { Kysely, CamelCasePlugin } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { DB } from "./types";
import type { AppEnv } from "../types";

export function createDatabase(env: AppEnv["Bindings"]): Kysely<DB> {
  return new Kysely<DB>({
    dialect: new D1Dialect({ database: env.DB }),
    plugins: [new CamelCasePlugin()],
  });
}
