import { RootContext } from "../../context";
import { SQLModule } from "../../shared-context";
import { Parser } from "node-sql-parser";

/**
 * Every SQL file needs its handlers
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
export default async (
  rootContext: RootContext,
  module: SQLModule
): Promise<RootContext> => {
  const { ast } = new Parser().parse(module.sql);
  // array valued always as this can be a batch and
  // now there is only one place we need to deal with the condition
  module.ast = Array.isArray(ast) ? ast : [ast];
  return rootContext;
};
