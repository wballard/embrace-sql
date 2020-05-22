/**
 * This containes context types shared between the EmbraceSQL server
 * and any generated code used by clients.
 *
 * This file is included whole in generated code, keeping it as a stand
 * alone code file like this is to allow highlighting and completion -- making
 * a huge about of code in handlebars is not fun in the editor, so the idea
 * here is to have a few base types, and derive a tiny bit in handlebars.
 *
 * Even though this isn't really a handlebars template, it is registered
 * as a partial, so resist the urge to use mustaches in here.
 */

/**
 * A message, passed for security and logging.
 */
export type Message = string | object;

/**
 * Security types.
 */
export type GrantType = "allow" | "deny";

/**
 * A single grant, stored away in the context.
 */
export type Grant = {
  /**
   * This type is set automatically for you.
   */
  type: GrantType;
  /**
   * Your additional message, which can be an object allowing you
   * to use it as a metadata store with security context informmation.
   */
  message: Message;
};

/**
 * Types mapped back into API calls from SQL.
 */
export type SQLType = "string" | "number" | "blob";

/**
 * Named parameters.
 */
export type SQLNamedParameter = {
  /**
   * Set by name, these will be hash keys in a parameter object.
   */
  name: string;
  /**
   * Type to pass -- default will be string.
   */
  type: SQLType;
};

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
   * Result set metadata, which may be an array because of semicolon batches.
   */
  resultsetMetadata?: Array<SQLColumnMetadata>;
  /**
   * Module safe name for the context.
   */
  contextName?: string;
  /**
   * All the parameters we found by looking at the query.
   */
  namedParameters?: Array<SQLNamedParameter>;
};

/**
 * Transaction control for databases.
 */
export type DatabaseTransactions = {
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
 * All databases available.
 *
 * @typeParam DatabaseNames - a string literal type union with each of your database names
 */
export type Databases<DatabaseNames extends string> = {
  [DatabaseName in DatabaseNames]: Database;
};

/**
 * Parameters can have a wide array of values, but they all need to be
 * able to turn into a string to finally create SQL.
 */
export type ParameterValue = {
  /**
   * String representation of the parameter, suitable for SQL.
   */
  toString: () => string;
};
/**
 * Parameters as passed to the SQLModule. This can be extended
 * or modified at runtime in handlers.
 *
 * These parameters can be passed by name, so a parameter called `pig` will
 * be used in SQL as `:pig`
 */
type ContextParameters<ParameterNames extends string> = {
  [ParameterName in ParameterNames]: ParameterValue | null;
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
  allow: (message: Message) => void;

  /**
   * Set the current start of security to deny SQL execution against the database.
   *
   * @param message - Any helpful message you see fit, will be appended to [[grants]].
   */
  deny: (message: Message) => void;

  /**
   * View all the reasons security might have been [[allow]] or [[deny]].
   */
  grants: Array<Grant>;

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
   * The current database in use for this SQLModule.
   */
  database: Database;

  /**
   * All available databases.
   */
  databases: Databases<DatabaseNames>;

  /**
   * Parameters as passed to the SQL. This can be extended
   * or modified at runtime in handlers.
   */
  parameters: ContextParameters<ParameterNames>;
};

/**
 * Default parameter names.
 */
export type DefaultParameters = "";
