import { RootContext } from "./context";
import { renderTemplates, ToFile } from "./render";
import fs from "fs-extra";
import path from "path";

/**
 * Run code generation given a context.
 *
 * This will load up templates from a directory, render the templates,
 * and then save files.
 *
 * @param rootContext - render off a root context, not a runtime context, as no API is being called
 * @param templatesInDirectory - read every template in this directory, honoring .ignore files
 * @param overwrite - default false, but if you set this to true generated files will overwrite existing files
 */
export const generateFromTemplates = async (
  rootContext: RootContext,
  templatesInDirectory: string,
  overwrite = false
): Promise<Array<ToFile>> => {
  const renderedFiles = await renderTemplates(
    rootContext,
    path.join(__dirname, "templates", templatesInDirectory)
  );
  // one big promise array, wait till it is done
  const waitForThem = renderedFiles.map((toFile) =>
    fs
      .pathExists(toFile.fileName)
      .then((exists) =>
        !exists || overwrite
          ? fs.outputFile(toFile.fileName, toFile.content)
          : undefined
      )
  );
  await Promise.all(waitForThem);

  return renderedFiles;
};
