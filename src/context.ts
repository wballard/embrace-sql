import { Configuration } from "./configuration";
import { embraceDatabases } from "./database-engines";
import { embraceEventHandlers } from "./event-handlers";
import { Database, SQLModule, SQLColumnMetadata } from "./shared-context";
import { TableColumnAst } from "node-sql-parser";
import { SQLModuleInternal } from "./event-handlers/sqlmodule-pipeline";

/**
 * Keep track of individual migration files with this type.
 */
export type MigrationFile = {
  name: string;
  content: string;
};

/**
 * A single instance of a database for use internally.
 */
export type DatabaseInternal = Database & {
  /**
   * This is the tree of paths derived from SQL files on disk. This is in
   * a compressed path format, so each key can have / in it.
   */
  SQLModules: Map<string, SQLModule>;
  /**
   * Execute the sql module query on this database, and
   * promise some result.
   *
   * @param SQLModule - execute this module, returning results
   * @param parameters - name value has object of parameters
   */
  execute: (sqlModule: SQLModule, parameters: object) => Promise<Array<object>>;
  /**
   * Analyze the passed module and determine the resultset type(s).
   */
  analyze: (sqlModule: SQLModuleInternal) => Promise<Array<SQLColumnMetadata>>;
  /**
   * Parse out the SQL.
   */
  parse: (SQLModule) => TableColumnAst;
  /**
   * Do a migration.
   */
  migrate: (migrationFiles: Array<MigrationFile>) => Promise<void>;
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
  databases: Map<string, DatabaseInternal>;
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
  const rootContext = {
    configuration,
    databases: new Map<string, DatabaseInternal>(),
  };
  // need the database first, their connections are used
  // to mine metadata
  await embraceDatabases(rootContext);
  await embraceEventHandlers(rootContext);
  return rootContext;
};
