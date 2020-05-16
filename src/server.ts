import { RootContext } from "./context";
import Koa from "koa";
import YAML from "yaml";
import readFile from "read-file-utf8";
import path from "path";

/**
 * Create a HTTP server exposing an OpenAPI style set of endpoints for each Database
 * and SQLModule.
 *
 * This does not actually start the server, it just hands you an instance that you
 * can start listening to later.
 */
export const createServer = async (
  rootContext: RootContext
): Promise<Koa<Koa.DefaultState, Koa.DefaultContext>> => {
  const server = new Koa();
  const apiDefinition = YAML.parse(
    await readFile(
      path.join(rootContext.configuration.embraceSQLRoot, "openapi.yaml")
    )
  );
  console.log(apiDefinition);
  return server;
};
