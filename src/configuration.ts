import { cosmiconfig } from "cosmiconfig";
import Url from "url-parse";
import process from "process";
import path from "path";
const debug = require("debug")("embracesql:configuration");
import embraceDatabases, { DatabaseInstance } from "./database-engines";
import embraceEventHandlers from "./event-handlers";
import { generateFromTemplates } from "./generator";

/**
 * The all important root configuration. This tells EmbraceSQL which databases to manage.
 */
export type Configuration = {
  /**
   * The root directory used to start this config.
   */
  embraceSQLRoot: string;
  /**
   * URL identifying Kafka topic or REST endpoing to post commands.
   */
  twinCommandsTo?: string;
  /**
   * All available databases.
   */
  databases?: Map<string, Url>;
};

/**
 * This is the default to set up a new context on each API invocation, as well as 'the' context
 * for internal code generation.
 *
 * The type here is a bit different as the context used in 'client code' is generated
 * with database type names. Here on the inside
 */
export type RootContext = {
  /**
   * The configuration used to build this context.
   */
  configuration: Configuration;
  /**
   * All configured databases, by name. This is the internal root context, so this is a hash and
   * not named properties. Client contexts will be generated with names to provide awesome autocomplete.
   */
  databases: Map<string, DatabaseInstance>;
};

/**
 * Load up a configuration object.
 *
 * This will interpolate environment variables, build and object and hand it back.
 *
 * Will look in the current directory or a environment variable set root.
 */
export const loadConfiguration = async (): Promise<Configuration> => {
  const root = path.normalize(process.env.EMBRACESQL_ROOT || process.cwd());
  debug(root);
  // run the root generation templates, gives you something to work
  // with even if you start in an empty directory so that system 'always works'
  await generateFromTemplates(
    {
      configuration: {
        embraceSQLRoot: root,
      },
      databases: undefined,
    },
    "root"
  );
  // TODO env var substition loader hook
  // going with cosmic config -- even though this is just doing YAML for the moment
  const explorer = cosmiconfig("embracesql", {
    searchPlaces: ["embracesql.yaml", "embracesql.yml"],
  });
  const result = await explorer.search(root);
  const config = result.config as Configuration;
  config.embraceSQLRoot = root;
  // pop in some types so we are working with actual URLs
  let databases = new Map<string, Url>();
  Object.keys(result.config.databases).forEach((databaseName) => {
    databases[databaseName] = new Url(result.config.databases[databaseName]);
  });
  return {
    embraceSQLRoot: result.config.embraceSQLRoot,
    databases,
  };
};

/**
 * With a configuration in hand, set up a new rootContext.
 *
 * This is built to be called -- repeatedly if needed. The idea is you can watch, and
 * rebuild a whole new context as needed -- swapping the root context at runtime to
 * hot-reconfigure the system without worrying about any state leaking.
 */
export const buildRootContext = async (
  configuration: Configuration
): Promise<RootContext> => {
  let rootContext = {
    configuration,
    databases: new Map<string, DatabaseInstance>(),
  };
  await embraceDatabases(rootContext);
  await embraceEventHandlers(rootContext);
  return rootContext;
};
