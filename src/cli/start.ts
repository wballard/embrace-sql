import { Command } from "commander";
import path from "path";
import { loadConfiguration } from "../configuration";
import { buildRootContext } from "../context";
import { createServer } from "../server";

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
      const port = parseInt(PORT || process.env.PORT || "4567");
      const configuration = await loadConfiguration(root);
      const rootContext = await buildRootContext(configuration);
      const server = await createServer(rootContext);
      server.listen(port);
    }
  );
