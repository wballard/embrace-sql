/* eslint-disable @typescript-eslint/camelcase */
import fetch from "isomorphic-fetch";

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
 * SELECT statments run through a GET, asking the EmbraceSQL server
 * to run a query with optional parameters and come back with
 * a JSON encoded resultset.
 */
export const post = async (
  serverUrl: string,
  apiPath: string,
  parameters = {}
): Promise<Array<object>> => {
  const cleaned = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  // let any exception leak out to the client
  return fetch(`${cleaned}${apiPath}`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    body: JSON.stringify(parameters),
  }).then((response) => response.json());
};
