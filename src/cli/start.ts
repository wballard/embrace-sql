import { Command } from "commander";
import { loadConfiguration } from "../configuration";
import { buildInternalContext, InternalContext } from "../context";
import { createServer } from "../server";
import { watchRoot } from "../watcher";
import { Server } from "http";
import expandHomeDir from "expand-home-dir";
import path from "path";

/**
 * Initialization action.
 */
export default new Command()
  .command("start [EMBRACEQL_ROOT] [PORT]")
  .description("Start up EmbraceSQL. ")

  .action(
    async (EMBRACEQL_ROOT: string, PORT: string): Promise<void> => {
      // fully qualified path from here on down will make things a lot simpler
      const root = path.resolve(
        expandHomeDir(
          EMBRACEQL_ROOT || process.env.EMBRACEQL_ROOT || "/var/embracesql"
        )
      );
      const port = parseInt(PORT || process.env.PORT || "8765");
      const configuration = await loadConfiguration(root);

      const listen = async (rootContext: InternalContext): Promise<Server> => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { decorateInternalContext } = require(path.join(root, "context"));
        const server = await createServer(decorateInternalContext(rootContext));
        console.info("Listening", {
          EMBRACE_SQL_ROOT: configuration.embraceSQLRoot,
          PORT: port,
        });
        return server.listen(port);
      };
      const initialContext = await buildInternalContext(configuration);
      let listener = await listen(initialContext);
      const watcher = watchRoot(root);
      watcher.emitter.on("reload", async (newContext: InternalContext) => {
        console.info("Reloading");
        listener.close(async () => (listener = await listen(newContext)));
      });
    }
  );
