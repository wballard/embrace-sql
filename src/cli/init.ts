import { Command } from "commander";
import path from "path";
import { loadConfiguration } from "../configuration";
import { buildRootContext } from "../context";
/**
 * Initialization action.
 */
export const init = new Command()
  .command("init [EMBRACEQL_ROOT")
  .description("Initialize the current working directory with EmbraceSQL.")
  .action(async (EMBRACEQL_ROOT: string) => {
    const root = path.resolve(EMBRACEQL_ROOT || process.cwd());
    const configuration = await loadConfiguration(root);
    await buildRootContext(configuration);
  });
