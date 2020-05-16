import Url from "url-parse";
import embraceSQLite from "./sqlite";
import { RootContext } from "../context";
import { DatabaseInternal } from "../context";

/**
 * Embrace a database, bringing it into context.
 *
 * TODO: this needs a wrapper around each database to try to heal itself
 * and reconnect, or to fault and let the container worker process end.
 */
const embraceSingleDatabase = async (
  rootContext: RootContext,
  db: Url
): Promise<DatabaseInternal> => {
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
export const embraceDatabases = async (
  rootContext: RootContext
): Promise<Map<string, DatabaseInternal>> => {
  // name value pairs inside the root context -- there isn't a strongly
  // typed generated context type available to the generator itself
  const databases = new Map<string, DatabaseInternal>();
  Object.keys(rootContext.configuration.databases).forEach(
    async (databaseName) =>
      (rootContext.databases[databaseName] = await embraceSingleDatabase(
        rootContext,
        rootContext.configuration.databases[databaseName]
      ))
  );
  return databases;
};
