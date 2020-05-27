import { Command } from "commander";
import { loadConfiguration } from "../configuration";
import { buildRootContext, RootContext } from "../context";
import { createServer } from "../server";
import { watchRoot } from "../watcher";
import { Server } from "http";
import expandHomeDir from "expand-home-dir";
import path from "path";
import { createInProcess } from "../inprocess";

/**
 * Initialization action.
 */
export const start = new Command()
  .command("start [EMBRACEQL_ROOT] [PORT]")
  .description("Start up EmbraceSQL. ")

  .action(
    async (EMBRACEQL_ROOT: string, PORT: string): Promise<void> => {
      // fully qualified path from here on down will make things a lot simpler
      const root = path.resolve(
        expandHomeDir(
          EMBRACEQL_ROOT || process.env.EMBRACEQL_ROOT || process.cwd()
        )
      );
      const port = parseInt(PORT || process.env.PORT || "8765");
      const configuration = await loadConfiguration(root);

      const listen = async (rootContext: RootContext): Promise<Server> => {
        const server = await createServer(
          rootContext,
          createInProcess(rootContext)
        );
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
