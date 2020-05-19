import { RootContext, DatabaseInternal } from "../../context";
import { SQLModule } from "../../shared-context";

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
  sqlModules: SQLModule
): Promise<RootContext> => {
  const { ast, namedParameters } = database.parse(sqlModules);
  if (Array.isArray(ast)) {
    // we are only supporting single statements
  } else {
    sqlModules.ast = ast;
  }
  // all the parameters, string is the default and can be mutated later
  sqlModules.namedParameters = namedParameters.map((p) => ({
    name: p,
    type: "string",
  }));
  return rootContext;
};
