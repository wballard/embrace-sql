import { RootContext, DatabaseInternal } from "../../context";
import { SQLModule } from "../../shared-context";
import parseSQL from "./parse-sql";
import transformResultTypes from "./transform-result-types";
import transformParameterTypes from "./transform-parameter-types";
import generateDefaultHandlers from "./generate-default-handlers";

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
  // await makes this a lot less goofy than a promise chain
  await parseSQL(rootContext, database, sqlModule);
  await transformParameterTypes(rootContext, database, sqlModule);
  await transformResultTypes(rootContext, database, sqlModule);
  await generateDefaultHandlers(rootContext, sqlModule);
  return rootContext;
};
