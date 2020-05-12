import Url from "url-parse";
import { Configuration } from "../configuration";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { DatabaseInstance, SQLModule } from ".";
const debug = require("debug")("embracesql:sqlite");

/**
 * Embrace SQLite. Open it up and read the schema. This will create a database
 * if it does not exist.
 *
 * SQLite is a local file, so not a whole lot can go wrong. Except that a local file
 * can actually be a network file - so everything can go wrong...
 */
export default async (
  configuration: Configuration,
  db: Url
): Promise<DatabaseInstance> => {
  const filename = path.isAbsolute(db.pathname)
    ? db.pathname
    : path.normalize(path.join(configuration.embraceSQLRoot, db.pathname));
  // SQLite -- open is connection
  const database = await open({
    filename,
    driver: sqlite3.Database,
  });
  debug(database);
  // TODO -- do we need SAVEPOINT / nesting?
  return {
    transactions: {
      begin: async (): Promise<void> => {
        database.run("BEGIN IMMEDIATE TRANSACTION");
      },
      commit: async (): Promise<void> => {
        database.run("COMMIT");
      },
      rollback: async (): Promise<void> => {
        database.run("ROLLBACK");
      },
    },
    SQLModules: new Map<string, string | SQLModule>(),
  };
};
