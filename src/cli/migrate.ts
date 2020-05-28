import { Command } from "commander";
import { loadConfiguration } from "../configuration";
import { buildRootContext } from "../context";
import { migrate } from "../migrations";
import expandHomeDir from "expand-home-dir";
import path from "path";

/**
 * Initialization action.
 */
export default new Command()
  .command("migrate [EMBRACEQL_ROOT]")
  .description("Run database migrations.")

  .action(
    async (EMBRACEQL_ROOT: string): Promise<void> => {
      // fully qualified path from here on down will make things a lot simpler
      const root = path.resolve(
        expandHomeDir(
          EMBRACEQL_ROOT || process.env.EMBRACEQL_ROOT || "/var/embracesql"
        )
      );
      console.info("beginning migration", root);
      const configuration = await loadConfiguration(root);
      const initialContext = await buildRootContext(configuration);
      await migrate(initialContext);
    }
  );
