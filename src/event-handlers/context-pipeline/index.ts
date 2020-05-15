import { RootContext } from "../../context";
import generateCombined from "./generate-combined";

/**
 * After each SQLModule is run through a pipeline, combine the results for an
 * overall context. This will stitch together generated code into a contett containing
 * all the databases and SQL in a given system.
 */
export default async (rootContext: RootContext): Promise<RootContext> => {
  await generateCombined(rootContext);
  return rootContext;
};
