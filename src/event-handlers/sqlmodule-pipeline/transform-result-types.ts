import { RootContext } from "../../context";
import { SQLModule } from "../../shared-context";
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
  sqlModule: SQLModule
): Promise<RootContext> => {
  try {
    await sqlModule.database.transactions.begin();
    await sqlModule.database.analyze(sqlModule);
  } finally {
    await sqlModule.database.transactions.rollback();
  }
  return rootContext;
};
