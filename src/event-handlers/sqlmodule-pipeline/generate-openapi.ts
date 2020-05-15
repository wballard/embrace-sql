import { RootContext } from "../../context";
import { SQLModule } from "../../database-engines";
import { generateFromTemplates } from "../../generator";

/**
 * Every SQL file will have a path handler from open API
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
export default async (
  rootContext: RootContext,
  sqlModule: SQLModule
): Promise<RootContext> => {
  if (sqlModule.ast) {
    const allSELECT = sqlModule.ast?.every((query) => query.type === "select");
    const multipleResultsets = sqlModule?.resultsetMetadata?.length > 1;
    const rendered = await generateFromTemplates(
      Object.assign({}, rootContext, {
        module: Object.assign({}, sqlModule, { allSELECT, multipleResultsets }),
      }),
      "handlers/openapi"
    );
    sqlModule.openAPI = rendered.map((r) => r.content).join("\n");
  }
  return rootContext;
};
