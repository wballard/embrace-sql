import { RootContext } from "./context";
import Koa from "koa";
import bodyparser from "koa-bodyparser";
import OpenAPIBackend from "openapi-backend";
import YAML from "yaml";
import readFile from "read-file-utf8";
import path from "path";
import { SQLModule } from "./shared-context";
import { DatabaseInternal } from "./context";

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

  // generated configuration is loaded up
  // TODO: the configuration is left on disk for current debugging -- but probably should be hidden
  const definition = YAML.parse(
    await readFile(
      path.join(rootContext.configuration.embraceSQLRoot, "openapi.yaml")
    )
  );

  // collect every database and module
  type DatabaseModule = {
    database: DatabaseInternal;
    sqlModule: SQLModule;
  };
  const allSQLModules = Object.values(rootContext.databases).flatMap(
    (database) =>
      Object.values(database.SQLModules).flatMap((sqlModule) => ({
        database,
        sqlModule,
      }))
  ) as Array<DatabaseModule>;

  // go ahead and make a handler for both GET and POST
  // some of these GET handlers may not be connected at the OpenAPI layer
  // but a few extra functions isn't going to hurt anything
  const getHandlers = Object.fromEntries(
    allSQLModules.map((dbModule) => {
      return [
        `get__${dbModule.sqlModule.contextName}`,
        async (_openAPI, httpContext): Promise<void> => {
          httpContext.body = await dbModule.database.execute(
            dbModule.sqlModule,
            httpContext.request.query
          );
          httpContext.status = 200;
        },
      ];
    })
  );
  // everything gets a POST
  const postHandlers = Object.fromEntries(
    allSQLModules.map((dbModule) => {
      return [
        `post__${dbModule.sqlModule.contextName}`,
        async (_openAPI, httpContext): Promise<void> => {
          httpContext.body = await dbModule.database.execute(
            dbModule.sqlModule,
            httpContext.request.body
          );
          httpContext.status = 200;
        },
      ];
    })
  );

  const api = new OpenAPIBackend({
    definition,
    handlers: {
      ...getHandlers,
      ...postHandlers,
    },
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
