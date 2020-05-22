import { RootContext } from "./context";
import { Executor, SQLModule } from "./shared-context";
import { DatabaseInternal } from "./context";

/**
 * Create an in process execution engine. This will map 'client' generated types, which are
 * well defined types through to internal databases and SQLModules which have looser dynamic typing.
 *
 * Put well defnined types on in the generated client layer.
 */
export const createInProcess = (
  rootContext: RootContext
): Map<string, Executor> => {
  // no real need for code generation here, each SQLModule has an operation name
  // and the module itself
  type DatabaseModule = {
    database: DatabaseInternal;
    module: SQLModule;
  };
  const allSQLModules = Object.values(rootContext.databases).flatMap(
    (database) =>
      Object.values(database.SQLModules).flatMap((module) => ({
        database,
        module,
      }))
  ) as Array<DatabaseModule>;

  const handlers = new Map<string, Executor>();

  allSQLModules.forEach((dbModule) => {
    handlers.set(
      dbModule.module.contextName,
      async (parameters: object): Promise<object[]> =>
        dbModule.database.execute(dbModule.module, parameters)
    );
  });
  return handlers;
};
