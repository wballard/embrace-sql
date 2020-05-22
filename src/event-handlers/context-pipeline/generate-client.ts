import { RootContext } from "../../context";
import ncc from "@zeit/ncc";
import path from "path";
import process from "process";
import fs from "fs-extra";

/**
 * Post processing compilation for clients to bundle these into stand alone,
 * zero dependency modules with typescript type definition support.
 *
 * The intention here is to make these modules easier to use by not having
 * to fuss with peer dependencies.
 *
 * @rootContext - as usual, our root context
 */
export default async (rootContext: RootContext): Promise<RootContext> => {
  // fully qualified path here -- ncc is relative to itself unless you give
  // it a fully qualified path
  const root = path.join(
    process.cwd(),
    rootContext.configuration.embraceSQLRoot
  );
  //all the client libraries in this array
  const clientLibrarySources = [
    path.join(root, "context.ts"),
    path.join(root, "client/node/index.ts"),
    path.join(root, "client/browser/index.ts"),
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
          sourceMap: false, // default
          sourceMapBasePrefix: root, // default treats sources as output-relative
          sourceMapRegister: true, // default
          watch: false, // default
          v8cache: false, // default
          quiet: true, // default
          debugLog: false, // default
        });
        // js instead of the ts source
        await fs.outputFile(sourceFile.replace(/\.ts$/, ".js"), code);
        const waitForAssets = Object.keys(assets).map((assetFileName) => {
          const assetContent = (assets[assetFileName]
            .source as Buffer).toString("utf-8");
          return fs.outputFile(path.join(root, assetFileName), assetContent);
        });
        await Promise.all(waitForAssets);
      } catch (e) {
        console.error(e);
      }
    }
  );
  await Promise.all(waitForAll);
  return rootContext;
};
