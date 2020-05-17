import { RootContext } from "./context";
import Koa from "koa";
import bodyparser from "koa-bodyparser";
import OpenAPIBackend from "openapi-backend";
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

  const definition = YAML.parse(
    await readFile(
      path.join(rootContext.configuration.embraceSQLRoot, "openapi.yaml")
    )
  );

  const api = new OpenAPIBackend({
    definition,
  });
  api.init();

  // use as koa middleware
  server.use(bodyparser());
  server.use((ctx) => api.handleRequest(ctx.request, ctx));

  // looks like we can get away without any code generation, and just building a
  // map of operation id based handlers
  // https://github.com/anttiviljami/openapi-backend/blob/master/examples/koa/index.js
  return server;
};
