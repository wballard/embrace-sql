import { RootContext } from "../../context";
import { generateFromTemplates } from "../../generator";

/**
 * Stitch together all the individual SQLModules into final templates.
 *
 * @rootContext - as usual, our root context
 */
export default async (rootContext: RootContext): Promise<RootContext> => {
  await generateFromTemplates(Object.assign({}, rootContext), "root");
  return rootContext;
};
