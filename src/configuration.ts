import { cosmiconfig } from "cosmiconfig";
import Url from "url-parse";
import process from "process";
import path from "path";
const debug = require("debug")("embracesql:configuration");
import embraceDatabases, { DatabaseInstance } from "./database-engines";

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
  databases: Map<string, Url>;
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
  // TODO env var substition loader hook
  const explorer = cosmiconfig("embracesql", {
    searchPlaces: ["embracesql.yaml", "embracesql.yml"],
  });
  const result = await explorer.search(root);
  const config = result.config as Configuration;
  config.embraceSQLRoot = root;
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
 * With a configuration in hand, set up the root context.
 */
export const buildRootContext = async (
  configuration: Configuration
): Promise<RootContext> => {
  return {
    databases: await embraceDatabases(configuration),
  };
};
