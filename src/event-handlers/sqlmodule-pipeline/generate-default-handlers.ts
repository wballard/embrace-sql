import { InternalContext } from "../../context";
import { generateFromTemplates } from "../../generator";
import { SQLModuleInternal } from ".";
import path from "path";

/**
 * Every SQL file needs its handlers
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
export default async (
  rootContext: InternalContext,
  sqlModule: SQLModuleInternal
): Promise<InternalContext> => {
  // smells like SQLSpirit...
  if (sqlModule.ast) {
    await generateFromTemplates(
      Object.assign({}, rootContext, {
        module: sqlModule,
        relativeToRoot: path.relative(
          path.dirname(sqlModule.fullPath),
          rootContext.configuration.embraceSQLRoot
        ),
      }),
      "handlers"
    );
  }
  // folder level handlers that are not module specific
  const waitForThem = sqlModule.beforeHandlerPaths.map(async (folderPath) => {
    const fullFolderPath = path.resolve(
      path.join(rootContext.configuration.embraceSQLRoot, folderPath)
    );
    return generateFromTemplates(
      Object.assign({}, rootContext, {
        folderPath: fullFolderPath,
        relativeToRoot: path.relative(
          fullFolderPath,
          rootContext.configuration.embraceSQLRoot
        ),
      }),
      "folder-handlers"
    );
  });
  await Promise.all(waitForThem);
  return rootContext;
};
