import { Command } from "commander";
import { generateFromTemplates } from "../generator";
/**
 * Initialization action.
 */
export const init = new Command()
  .command("init")
  .description("Initialize the current working directory with EmbraceSQL.")
  .action(async () => {
    await generateFromTemplates(undefined, "cli", true);
  });
