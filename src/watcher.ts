import { EventEmitter } from "events";
import Watchpack from "watchpack";
import { loadConfiguration } from "./configuration";
import { buildRootContext } from "./context";

/**
 * Keep and eye on a root directory and rebuild it when files change.
 *
 * Note -- no need to worry about race conditions `buildRootContext` has
 * a throttle inside.
 */
export const watchRoot = (embraceSQLRoot: string): EventEmitter => {
  const emitter = new EventEmitter();

  // watch the whole directory
  const watcher = new Watchpack({
    aggregateTimeout: 1000,
    poll: true,
  });
  watcher.watch([], [embraceSQLRoot], Date.now());

  // reload on any change -- count on the context builder
  // to figure out what has really changed and throttle
  const reload = async (): Promise<void> => {
    const configuration = await loadConfiguration(embraceSQLRoot);
    const newRootContext = await buildRootContext(configuration);
    emitter.emit("reload", newRootContext);
  };
  // this is super convenient to not drown in a pile of single file changes
  watcher.on("aggregated", reload);

  return emitter;
};
