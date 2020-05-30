/* eslint-disable @typescript-eslint/camelcase */

import * as types from "../../context";

/**
 * Create an EmbraceSQL cient for use embedded in process. This takes an execution map,
 * which directly executes a SQLModule, by name, with a function, not an HTTP POST.
 *
 * This function can be any thing that takes SQL Parameters -- name value pairs in
 * an object, and returns a result set -- an array of objects that are name value pairs
 * that are the resulting rows.
 *
 * To use this client, you need to create and pass in an execution map, which provides
 * a way to execute a SQLModule by its unique `contextName`.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
type EmbraceSQLParameters = {
  directQueryExecutors: types.Executors;
};
export const EmbraceSQL = ({ directQueryExecutors }: EmbraceSQLParameters) => {
  const DatabaseMap = {
    databases: {
      default: {
        hello: {
          sql: async (
            parameters: types.default_helloParameters
          ): Promise<types.default_helloResults> => {
            // database default module tests/configs/hello-handler/default/hello.sql
            const e = directQueryExecutors.default_hello;
            const results = e ? await e(parameters) : [];
            return (results as unknown) as types.default_helloResults;
          },
        },
      },
    },
  };
  return DatabaseMap;
};
