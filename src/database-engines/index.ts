import Url from "url-parse";
import embraceSQLite from "./sqlite";
import { Configuration } from "../configuration";

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
  configuration: Configuration,
  db: Url
): Promise<DatabaseInstance> => {
  switch (db.protocol.split(":")[0].toLowerCase()) {
    case "sqlite":
      return embraceSQLite(configuration, db);
    default:
      return undefined;
  }
};

/**
 * Every database in the configuraton is embraced and brought into the context.
 */
export default async (
  configuration: Configuration
): Promise<Map<string, DatabaseInstance>> => {
  let databases = new Map<string, DatabaseInstance>();
  Object.keys(configuration.databases).forEach(
    async (databaseName) =>
      (databases[databaseName] = await embraceSingleDatabase(
        configuration,
        configuration.databases[databaseName]
      ))
  );
  return databases;
};
