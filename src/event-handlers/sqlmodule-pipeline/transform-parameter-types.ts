/* eslint-disable @typescript-eslint/no-unused-vars */
import { RootContext, DatabaseInternal } from "../../context";
import { SQLModuleInternal } from ".";

/**
 * Parameters have types too.
 *
 * @param rootContext - as usual, our root context
 * @param database - the database to use
 * @param sqlModules - the sql module to inspect
 */
export default async (
  rootContext: RootContext,
  _database: DatabaseInternal,
  _sqlModule: SQLModuleInternal
): Promise<RootContext> => {
  // TODO -- how on earth do you figure out parameter types!
  return rootContext;
};
