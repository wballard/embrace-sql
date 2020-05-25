import { RootContext, DatabaseInternal } from "../../context";
import { SQLModule } from "../../shared-context";
import parseSQL from "./parse-sql";
import transformResultTypes from "./transform-result-types";
import transformParameterTypes from "./transform-parameter-types";
import generateDefaultHandlers from "./generate-default-handlers";
import type { AST } from "node-sql-parser";
import pLimit from "p-limit";

/**
 * Serialize analysis -- this ends up being required
 * as we really one have *one* connection.
 */
const oneAtATime = pLimit(1);

/**
 * Inside the EmbraceSQL exgine extension to the SQLModule type.
 */
export type SQLModuleInternal = SQLModule & {
  /**
   * Parsed SQL abstract syntax tree, one AST, only one statement is allowed.
   */
  ast?: AST;
};

/**
 * Each SQLModule runs through a transformation pipeline. This differs slightly
 * from a nominal compiler in that each stage of the pipeline can update a shared
 * context, as well as emit additional files.
 */
export default async (
  rootContext: RootContext,
  database: DatabaseInternal,
  sqlModule: SQLModule
): Promise<RootContext> => {
  // this is a concurrency throttle as we really on have one
  // database connection
  await oneAtATime(async () => {
    const sqlModuleInternal = sqlModule as SQLModuleInternal;
    // await makes this a lot less goofy than a promise chain
    await parseSQL(rootContext, database, sqlModuleInternal);
    await transformParameterTypes(rootContext, database, sqlModuleInternal);
    await transformResultTypes(rootContext, database, sqlModuleInternal);
    await generateDefaultHandlers(rootContext, sqlModuleInternal);
  });
  return rootContext;
};
