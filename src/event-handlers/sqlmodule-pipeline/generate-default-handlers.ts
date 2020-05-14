import { RootContext } from "../../context";
import { SQLModule } from "../../database-engines";
import { generateFromTemplates } from "../../generator";

/**
 * Every SQL file needs its handlers
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
export default async (
  rootContext: RootContext,
  sqlModule: SQLModule
): Promise<RootContext> => {
  // smells like SQLSpirit...
  if (sqlModule.ast) {
    await generateFromTemplates(
      Object.assign({}, rootContext, { module: sqlModule }),
      "handlers/js"
    );
  }
  return rootContext;
};
