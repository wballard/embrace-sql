import embraceSQLite from "./sqlite";
import { RootContext } from "../context";
import { DatabaseInternal } from "../context";
import pLimit from "p-limit";
import { SQLModule, SQLColumnMetadata } from "../../scratch/context";
import { SQLModuleInternal } from "../event-handlers/sqlmodule-pipeline";

/**
 * Serialize database use per process as we really only have one connection.
 */
const oneAtATime = pLimit(1);

/**
 * Embrace a database, bringing it into context.
 *
 * TODO: this needs a wrapper around each database to try to heal itself
 * and reconnect, or to fault and let the container worker process end.
 */
const embraceSingleDatabase = async (
  rootContext: RootContext,
  databaseName: string
): Promise<DatabaseInternal> => {
  const dbUrl = rootContext.configuration?.databases[databaseName];
  switch (dbUrl.protocol.split(":")[0].toLowerCase()) {
    case "sqlite":
      return embraceSQLite(rootContext, databaseName);
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
    async (databaseName) => {
      const database = await embraceSingleDatabase(rootContext, databaseName);
      rootContext.databases[databaseName] = {
        ...database,
        // here is wrapping the individual database driver execute and analyze
        // with a throttled promise limit -- since we have only one connection
        // these are not re-entrant
        execute: async (
          sqlModule: SQLModule,
          parameters: object
        ): Promise<object[]> => {
          const results = await oneAtATime(() =>
            database.execute(sqlModule, parameters)
          );
          return results as object[];
        },
        analyze: async (
          sqlModule: SQLModuleInternal
        ): Promise<Array<SQLColumnMetadata>> => {
          const results = await oneAtATime(() => database.analyze(sqlModule));
          return results as Array<SQLColumnMetadata>;
        },
      };
    }
  );
  return databases;
};
