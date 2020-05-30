import { EventEmitter } from "events";
import { loadConfiguration } from "./configuration";
import { buildInternalContext } from "./context";
import chokidar from "chokidar";

/**
 * Need to be able to close this off to exit cleanly
 * in unit testing.
 */
export type CloseableEventEmitter = {
  emitter: EventEmitter;
  close: () => Promise<void>;
};

/**
 * Keep and eye on a root directory and rebuild it when files change.
 *
 * Note -- no need to worry about race conditions `buildRootContext` has
 * a throttle inside.
 */
export const watchRoot = (embraceSQLRoot: string): CloseableEventEmitter => {
  const emitter = new EventEmitter();

  // watch the whole directory
  const watcher = chokidar.watch([`${embraceSQLRoot}/**/*.sql`]);

  // reload on any change -- count on the context builder
  // to figure out what has really changed and throttle
  const reload = async (path): Promise<void> => {
    console.info("reload needed", path);
    const configuration = await loadConfiguration(embraceSQLRoot);
    const newRootContext = await buildInternalContext(configuration);
    emitter.emit("reload", newRootContext);
  };
  // this is super convenient to not drown in a pile of single file changes
  watcher.on("change", reload);
  return {
    emitter,
    close: (): Promise<void> => watcher.close(),
  };
};
