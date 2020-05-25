import { RootContext } from "../../context";
import { generateFromTemplates } from "../../generator";
import { SQLModuleInternal } from ".";

/**
 * Every SQL file needs its handlers
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
export default async (
  rootContext: RootContext,
  sqlModule: SQLModuleInternal
): Promise<RootContext> => {
  // smells like SQLSpirit...
  if (sqlModule.ast) {
    await generateFromTemplates(
      Object.assign({}, rootContext, { module: sqlModule }),
      "handlers"
    );
  }
  return rootContext;
};
