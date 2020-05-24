import { program } from "commander";
import pj from "../../package.json";
import { init } from "./init";
import { start } from "./start";
import { install } from "../structured-console";

/**
 * Our little command line interface. This can be used from Docker -- which is the
 * intended use, or with `yarn cli` for development and testing.
 */
const main = async (): Promise<void> => {
  install();
  program.version(pj.version);
  program.description(`Command line interface to EmbraceSQL.`);
  program.addCommand(init);
  program.addCommand(start);
  // GO!
  await program.parseAsync(process.argv);
};
main();
