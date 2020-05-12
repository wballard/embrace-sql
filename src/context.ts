import { Configuration } from "./configuration";
import { DatabaseInstance } from "./database-engines";
import { embraceDatabases } from "./database-engines";
import { embraceEventHandlers } from "./event-handlers";

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
 * This context is the 'one true parameter' passed to every Embrace SQL
 * event handler. It is created by EmbraceSQL at the start of each API
 * request, and serves as a shared state allowing handlers broad access
 * to the results of other handlers and databases managed by EmbraceSQL.
 *
 * Having a single context parameter simplifies call signatures and facilitates
 * auto-complete in your editing experience.
 *
 * This context is the base type. EmbraceSQL will generate an extended context
 * representing your specific set of configured databases. Properties of the context
 * that will be generated will be noted in comments.
 *
 * @typeParam DatabaseNames - a string literal type union with each of your database names
 */
export type Context<
  DatabaseNames extends string,
  ParameterNames extends string
> = {
  /**
   * Set the current state of security to allow SQL execution against the database.
   *
   * @param message - Any helpful message you see fit, will be appended to [[grants]].
   */
  allow: (message: any) => void;

  /**
   * Set the current start of security to deny SQL execution against the database.
   *
   * @param message - Any helpful message you see fit, will be appended to [[grants]].
   */
  deny: (message: any) => void;

  /**
   * View all the reasons security might have been [[allow]] or [[deny]].
   */
  grants: Array<any>;

  /**
   * If a JWT token from an `Authorization: Bearer <token>` header has been successfully
   * decoded and verified, it will be here.
   */
  token?: object;

  /**
   * Put the current user identifier string here in order to integrate with database
   * user level secruity features. For exampe, in PostgreSQL, this property will be used as:
   *
   * `SET LOCAL SESSION AUTHORIZATION ${context.current_user}`
   */
  current_user?: string;

  /**
   * Put the current role identifier string here in order to integrate with database
   * role level secruity features. For exampe, in PostgreSQL, this property will be used as:
   *
   * `SET LOCAL ROLE ${context.role}`
   */
  role?: string;

  /**
   * The current SQL string to be executed. This becomes read only after execution.
   */
  sql: string;

  /**
   * The current unhandled exception error.
   */
  error?: object;

  /**
   * The current database, this will default to
   * * the `default` database in your configuration
   * * the first database listed in your configuration if none is called default
   */
  database: Database;

  /**
   * All available databases.
   */
  databases: Databases<DatabaseNames>;

  /**
   * Parameters as passed to the SQL API or AutoCRUD. This can be extended
   * or modified at runtime in handlers.
   */
  parameters: ContextParameters<ParameterNames>;
};

/**
 * All databases available.
 *
 * @typeParam DatabaseNames - a string literal type union with each of your database names
 */
type Databases<DatabaseNames extends string> = {
  [DatabaseName in DatabaseNames]: Database;
};

/***
 * A single database available via the context
 */
export type Database = {
  /**
   * Access transaction control of the database here.
   */
  transactions: DatabaseTransactions;
};

/**
 * Transaction control for databases.
 */
type DatabaseTransactions = {
  /**
   * Start up a new transaction, or if in a transaction, a nested
   * transaction.
   */
  begin: () => Promise<void>;

  /**
   * Commit the in process transaction. Database state changes are saved.
   */
  commit: () => Promise<void>;

  /**
   * Roll back the in process transaction, such that any database
   * state changes are no saved.
   */
  rollback: () => Promise<void>;
};

/**
 * Parameters can have a wide array of values, but they all need to be
 * able to turn into a string to finally create SQL.
 */
type ParameterValue = {
  /**
   * String representation of the parameter, suitable for SQL.
   */
  toString: () => string;
};

/**
 * Parameters as passed to the SQL API or AutoCRUD. This can be extended
 * or modified at runtime in handlers.
 *
 * These parameters can be passed by name, so a parameter called `pig` will
 * be used in SQL as `:pig`
 */
type ContextParameters<ParameterNames extends string> = {
  [ParameterName in ParameterNames]: ParameterValue | null;
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
    databases: new Map<string, DatabaseInstance>(),
  };
  // need the database first, their connections are used
  // to mine metadata
  await embraceDatabases(rootContext);
  await embraceEventHandlers(rootContext);
  return rootContext;
};
