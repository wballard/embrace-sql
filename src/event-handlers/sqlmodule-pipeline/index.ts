import { RootContext } from "../../context";
import { SQLModule } from "../../shared-context";
import parseSQL from "./parse-sql";
import transformResultTypes from "./transform-result-types";
import generateDefaultHandlers from "./generate-default-handlers";
import generateOpenAPI from "./generate-openapi";

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
  await transformResultTypes(rootContext, sqlModule);
  await generateDefaultHandlers(rootContext, sqlModule);
  await generateOpenAPI(rootContext, sqlModule);
  return rootContext;
};
