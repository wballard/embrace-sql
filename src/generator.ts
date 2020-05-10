import { RootContext } from "./configuration";
import { renderTemplates } from "./render";
import fs from "fs-extra";

/**
 * Run code generation given a context.
 *
 * This will load up templates from a directory, render the templates,
 * and then save files.
 *
 * @param templatesInDirectory - read every template in this directory, honoring .ignore files
 * @param rootContext - render off a root context, not a runtime context, as no API is being called
 * @param overwrite - default false, but if you set this to true generated files will overwrite existing files
 */
export const generateFromTemplates = async (
  templatesInDirectory: string,
  rootContext: RootContext,
  overwrite = false
) => {
  const renderedFiles = await renderTemplates(
    templatesInDirectory,
    rootContext
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

  // no return, on purpose
};
