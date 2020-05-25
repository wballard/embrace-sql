import { Command } from "commander";
import path from "path";
import { loadConfiguration } from "../configuration";
import { buildRootContext, RootContext } from "../context";
import { createServer } from "../server";
import { watchRoot } from "../watcher";

/**
 * Initialization action.
 */
export const start = new Command()
  .command("start [EMBRACEQL_ROOT] [PORT]")
  .description("Start up EmbraceSQL. ")

  .action(
    async (EMBRACEQL_ROOT: string, PORT: string): Promise<void> => {
      const root = path.resolve(
        EMBRACEQL_ROOT || process.env.EMBRACEQL_ROOT || process.cwd()
      );
      const port = parseInt(PORT || process.env.PORT || "8765");
      const configuration = await loadConfiguration(root);

      const listen = async (rootContext: RootContext) => {
        const server = await createServer(rootContext);
        console.info("Listening", {
          EMBRACE_SQL_ROOT: configuration.embraceSQLRoot,
          PORT: port,
        });
        return server.listen(port);
      };
      const initialContext = await buildRootContext(configuration);
      let listener = await listen(initialContext);
      const watcher = watchRoot(root);
      watcher.emitter.on("reload", async (newContext: RootContext) => {
        console.info("Reloading");
        listener.close();
        listener = await listen(newContext);
      });
    }
  );
