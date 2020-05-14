import Url from "url-parse";
import embraceSQLite from "./sqlite";
import { RootContext, Database } from "../context";
import { AST } from "node-sql-parser";

/**
 * Types mapped back into API calls from SQL.
 */
export type SQLType = "string" | "number" | "blob";

/**
 * One result set column metadata.
 */
export type SQLColumnMetadata = {
  /**
   * Use this name to access the row. These are valid JavaScript variable names.
   */
  name: string;

  /**
   * Type identifier.
   */
  type: SQLType;
};

/**
 * Each SQL found on disk has some data -- the SQL itself, and will
 * get additional metadata attached to it.
 */
export type SQLModule = {
  /**
   * Reference back to the containing database.
   */
  database: DatabaseInstance;
  /**
   * Relative path useful for REST.
   */
  relativePath: string;
  /**
   * Fully qualified file name on disk.
   */
  fullPath: string;
  /**
   * Actual SQL text source, unmodified, read from disk
   */
  sql: string;
  /**
   * Content based cache key to use for any hash lookups, so that content
   * changes to the SQL equal cache misses.
   */
  cacheKey: string;
  /**
   * Parsed SQL abstract syntax tree, which can be an array becuse
   * of semicolon batches.
   */
  ast?: AST[];
  /**
   * Result set metadata, which may be an array because of semicolon batches.
   */
  resultsetMetadata?: Array<Array<SQLColumnMetadata>>;
};

/**
 * A single instance of a database, with attached SQLFiles.
 */
export type DatabaseInstance = Database & {
  /**
   * This is the tree of paths derived from SQL files on disk.
   */
  SQLModules: Map<string, string | SQLModule>;
  /**
   * Execute the sql module query on this database, and
   * promise some result.
   *
   * TODO: Resultset object definition
   */
  execute: (SQLModule) => Promise<object>;
  /**
   * Analyze the passed module and determine the resultset type(s).
   */
  analyze: (SQLModule) => Promise<object>;
};

/**
 * Embrace a database, bringing it into context.
 *
 * TODO: this needs a wrapper around each database to try to heal itself
 * and reconnect, or to fault and let the container worker process end.
 */
const embraceSingleDatabase = async (
  rootContext: RootContext,
  db: Url
): Promise<DatabaseInstance> => {
  switch (db.protocol.split(":")[0].toLowerCase()) {
    case "sqlite":
      return embraceSQLite(rootContext.configuration, db);
    default:
      return undefined;
  }
};

/**
 * Every database in the configuraton is embraced and brought into the context.
 */
export const embraceDatabases = async (
  rootContext: RootContext
): Promise<Map<string, DatabaseInstance>> => {
  // name value pairs inside the root context -- there isn't a strongly
  // typed generated context type available to the generator itself
  const databases = new Map<string, DatabaseInstance>();
  Object.keys(rootContext.configuration.databases).forEach(
    async (databaseName) =>
      (rootContext.databases[databaseName] = await embraceSingleDatabase(
        rootContext,
        rootContext.configuration.databases[databaseName]
      ))
  );
  return databases;
};
