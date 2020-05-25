import { RootContext, DatabaseInternal } from "../../context";
import { SQLModuleInternal } from ".";

/**
 * Parse the SQL in a module, extracting the abstract syntax tree
 * and all of the parameters
 *
 * @param rootContext - as usual, our root context
 * @param database - parse using this specific database
 * @param sqlModule - parse and update this module
 */
export default async (
  rootContext: RootContext,
  database: DatabaseInternal,
  sqlModule: SQLModuleInternal
): Promise<RootContext> => {
  const { ast } = database.parse(sqlModule);
  if (Array.isArray(ast)) {
    // we are only supporting single statements
    throw new Error("Only one SQL statement is supported per .sql file.");
  } else {
    sqlModule.ast = ast;
  }
  return rootContext;
};
