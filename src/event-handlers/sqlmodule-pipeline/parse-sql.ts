import { RootContext, DatabaseInternal } from "../../context";
import { SQLModule } from "../../shared-context";

/**
 * Every SQL file needs its handlers
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
export default async (
  rootContext: RootContext,
  database: DatabaseInternal,
  module: SQLModule
): Promise<RootContext> => {
  const { ast, namedParameters } = database.parse(module);
  module.ast = Array.isArray(ast) ? ast : [ast];
  // all the parameters, string is the default and can be mutated later
  module.namedParameters = namedParameters.map((p) => ({
    name: p,
    type: "string",
  }));
  return rootContext;
};
