import Url from "url-parse";
import embraceSQLite from "./sqlite";
import { RootContext } from "../configuration";

/**
 * A single instance of a database
 */
export type DatabaseInstance = Database;

/**
 * Embrace a database, bringing it into context.
 *
 * TODO: this needs a wrapper around each database to try to heal itself
 * and reconnect.
 */
const embraceSingleDatabase = async (
  rootContext: RootContext,
  db: Url
): Promise<DatabaseInstance> => {
  switch (db.protocol.split(":")[0].toLowerCase()) {
    case "sqlite":
      return embraceSQLite(rootContext.configuration, db);
    default:
      return undefined;
  }
};

/**
 * Every database in the configuraton is embraced and brought into the context.
 */
export default async (
  rootContext: RootContext
): Promise<Map<string, DatabaseInstance>> => {
  let databases = new Map<string, DatabaseInstance>();
  Object.keys(rootContext.configuration.databases).forEach(
    async (databaseName) =>
      (rootContext.databases[databaseName] = await embraceSingleDatabase(
        rootContext,
        rootContext.configuration.databases[databaseName]
      ))
  );
  return databases;
};
