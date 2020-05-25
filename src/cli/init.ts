import { Command } from "commander";
import { generateFromTemplates } from "../generator";
/**
 * Initialization action.
 */
export const init = new Command()
  .command("init")
  .description("Generates a docker-compose.yaml so you can get started.")
  .action(async () => {
    await generateFromTemplates(undefined, "cli", true);
  });
