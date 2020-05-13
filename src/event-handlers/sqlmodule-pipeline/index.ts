import { RootContext } from "../../context";
import { SQLModule } from "../../database-engines";
import parseSQL from "./parse-sql";
import generateDefaultHandlers from "./generate-default-handlers";

/**
 * Each SQLModule runs through a transformation pipeline. This differs slightly
 * from a nominal compiler in that each stage of the pipeline can update a shared
 * context, as well as emit additional files.
 */
export default async (
  rootContext: RootContext,
  sqlModule: SQLModule
): Promise<RootContext> => {
  // await makes this a lot less goofy than a promise chain
  await parseSQL(rootContext, sqlModule);
  await generateDefaultHandlers(rootContext, sqlModule);
  return rootContext;
};
