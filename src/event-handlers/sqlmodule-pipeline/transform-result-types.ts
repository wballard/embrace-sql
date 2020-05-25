import { RootContext, DatabaseInternal } from "../../context";
import { SQLModuleInternal } from ".";

/**
 * Run the query -- but in a transaction so the database doesn't get
 * modified. This allows an inspection of the resultset(s) to figure out
 * columns and types.
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
export default async (
  rootContext: RootContext,
  database: DatabaseInternal,
  sqlModule: SQLModuleInternal
): Promise<RootContext> => {
  try {
    await database.transactions.begin();
    sqlModule.resultsetMetadata = await database.analyze(sqlModule);
  } finally {
    await database.transactions.rollback();
  }
  return rootContext;
};
