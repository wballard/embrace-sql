import { InternalContext } from "./context";
import { Executors, SQLModule, SQLParameters, SQLRow } from "./shared-context";
import { DatabaseInternal } from "./context";

/**
 * In addition to using EmbraceSQL over HTTP clients, you can embed it into a node process
 * and go right at your databases directly from a node process, this removes the need
 * for the EmbraceSQL server, and is handy for React Native local SQLite.
 */
export const createInProcess = (rootContext: InternalContext): Executors => {
  type DatabaseModule = {
    database: DatabaseInternal;
    sqlModule: SQLModule;
  };
  // collect every sql module in every database
  const allSQLModules = Object.values(rootContext.databases).flatMap(
    (database) =>
      Object.values(database.SQLModules).flatMap((sqlModule) => ({
        database,
        sqlModule,
      }))
  ) as DatabaseModule[];

  // process any given sql module by asking it's owning database to execute it
  // each module has a `contextName` which is a nice key to use in this module Map
  const handlers = Object.fromEntries(
    allSQLModules.map((dbModule) => [
      dbModule.sqlModule.contextName,
      async (parameters: SQLParameters): Promise<SQLRow[]> =>
        dbModule.database.execute(dbModule.sqlModule, parameters),
    ])
  );
  return handlers;
};
