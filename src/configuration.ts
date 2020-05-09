import { cosmiconfig } from "cosmiconfig";
import process from "process";
const debug = require("debug")("embracesql:configuration");

/**
 * The all important root configuration. This tells EmbraceSQL which databases to manage.
 */
type Configuration = {
  /**
   * URL identifying Kafka topic or REST endpoing to post commands.
   */
  twinCommandsTo?: string;
  /**
   * All available databases.
   */
  databases: Databases<string>;
};

/**
 * All databases available, keyed by name, with the value being a connection URL.
 *
 * @typeParam DatabaseNames - a string literal type union with each of your database names
 */
type Databases<DatabaseNames extends string> = {
  [DatabaseName in DatabaseNames]: string;
};

/**
 * Load up a configuration object.
 *
 * This will interpolate environment variables, build and object and hand it back.
 *
 * Will look in the current directory or a environment variable set root.
 */
export const loadConfiguration = async (): Promise<Configuration> => {
  const root = process.env.EMBRACESQL_ROOT || process.cwd();
  debug(root);
  // TODO env var substition for js and yaml
  const explorer = cosmiconfig("embracesql", {
    searchPlaces: ["embracesql.yaml", "embracesql.yml"],
  });
  const result = await explorer.search(root);
  return result.config as Configuration;
};
