import { RootContext } from "../../context";
import yarn from "yarn-api";
import path from "path";

/**
 * EmbraceSQL Root directory is actually a node packace, so make sure to
 * get the dependencies.
 *
 * @rootContext - as usual, our root context
 */
export default async (rootContext: RootContext): Promise<RootContext> => {
  await new Promise((resolve, reject) => {
    yarn.install(
      [
        "--no-progress",
        "--silent",
        "--cwd",
        path.resolve(rootContext.configuration.embraceSQLRoot),
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
  return rootContext;
};
