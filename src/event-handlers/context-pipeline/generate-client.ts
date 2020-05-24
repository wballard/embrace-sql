import { RootContext } from "../../context";
import ncc from "@zeit/ncc";
import path from "path";
import fs from "fs-extra";

/**
 * Create totally stand alone client files. These bundle in all the
 * dependencies so you can use a single js file with optional typescript
 * typings from node or from the browser.
 *
 * This should make the client super easy to include in a project without
 * needing to know or document which additional modules might be needed
 * as a dependency in your consuming application.
 *
 * @rootContext - as usual, our root context
 */
export default async (rootContext: RootContext): Promise<RootContext> => {
  // fully qualified path here -- ncc is relative to itself unless you give
  // it a fully qualified path
  const root = path.resolve(rootContext.configuration.embraceSQLRoot);
  //all the client libraries in this array
  const clientLibrarySources = [
    path.resolve(path.join(root, "client/node/index.ts")),
    path.resolve(path.join(root, "client/node-inprocess/index.ts")),
    path.resolve(path.join(root, "client/browser/index.ts")),
  ];
  const waitForAll = clientLibrarySources.map(
    async (sourceFile): Promise<void> => {
      // compilation needs to build both the js and the corresponding types
      try {
        const { code, assets } = await ncc(sourceFile, {
          // provide a custom cache path or disable caching
          cache: false,
          // externals to leave as requires of the build
          externals: [],
          // directory outside of which never to emit assets
          filterAssetBase: root,
          minify: false, // default
          sourceMap: false,
          sourceMapBasePrefix: root, // default treats sources as output-relative
          sourceMapRegister: true, // default
          watch: false, // default
          v8cache: false, // default
          quiet: true, // default
          debugLog: false, // default
        });
        // js replaces the ts, but type definitions remain
        await fs.unlink(sourceFile);
        await fs.outputFile(sourceFile.replace(/\.ts$/, ".js"), code);
        // type definitions are found in the assets
        const waitForAssets = Object.keys(assets).map((assetFileName) => {
          const assetContent = (assets[assetFileName]
            .source as Buffer).toString("utf-8");
          return fs.outputFile(path.join(root, assetFileName), assetContent);
        });
        await Promise.all(waitForAssets);
      } catch (e) {
        console.error(e);
      } finally {
      }
    }
  );
  await Promise.all(waitForAll);
  return rootContext;
};
