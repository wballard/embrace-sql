import { Configuration } from "./configuration";
import { DatabaseInstance } from "./shared-context";
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
