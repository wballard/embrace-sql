/* eslint-disable @typescript-eslint/camelcase */

/**
 * This contains base client types used as a seed for generation.
 *
 * The client differs from the server and event handlers in that
 * there is no context, these are 'normal' method invocations on a
 * structured object graph corresponding to all databases and
 * SQLModules. That's the word way of saying -- it makes objects with methods
 * you call with `.`.
 *
 * Even though this isn't really handlebars, it will be included in
 * handlebars so avoid mustaches.
 */

/**
 * In process invocation of a single SQLModule.
 */
export const invokeInProcess = async (
  databaseName: string,
  sqlModuleName: string
): Promise<object> => {
  // find the correct SQLModule
  // execute it
  return {};
};
