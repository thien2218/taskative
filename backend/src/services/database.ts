import { Kysely, CamelCasePlugin } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { DB } from "@/db/types";

export class DatabaseService {
  private readonly client: Kysely<DB>;

  constructor(d1: D1Database) {
    this.client = new Kysely<DB>({
      dialect: new D1Dialect({ database: d1 }),
      plugins: [new CamelCasePlugin()],
    });
  }

  /**
   * Access the underlying Kysely client with strongly-typed DB.
   */
  get db(): Kysely<DB> {
    return this.client;
  }

  /**
   * Convenience helper for running a transaction.
   */
  async transaction<R>(fn: (trx: Kysely<DB>) => Promise<R>): Promise<R> {
    return this.client.transaction().execute(async (trx) => fn(trx));
  }
}

export default DatabaseService;
