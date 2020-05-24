/* eslint-disable @typescript-eslint/no-explicit-any */
import process from "process";
import callsites from "callsites";
import path from "path";
/**
 * Modification to console so that it will generate structured data.
 *
 * This will track:
 * * log level
 * * where it was logged 'from'
 * * what was logged
 *
 * When attached to a tty, this will colorize, but will dump plain strings with no
 * color coding to non-tty streams.
 */

/**
 * Four levels.
 */
type LogLevel = "debug" | "info" | "error" | "warn" | "debug";

/**
 * Turn those arguments into an object.
 *
 * @param logLevel - enumerated string level value
 * @param msessage - primary message, can be anything but is usually a string
 * @param additional - more objects of any kind you want logged for more context
 */
const restructure = (
  logLevel: LogLevel,
  message: any,
  ...additional: any[]
): string => {
  const call = callsites();
  // up this call, and the log itself back to the call frame
  // in the *actual* source file that called log.
  const properDepth = call[2];
  const relativePath = path.relative(process.cwd(), properDepth.getFileName());
  // it is possible that the message is circular and cannot be sent to JSON
  try {
    JSON.stringify(message);
  } catch {
    message = message.toString();
  }
  return JSON.stringify({
    logLevel,
    source: `${relativePath}#${properDepth.getLineNumber()}`,
    message,
    additional,
  });
};

/**
 * Go back to the console as before.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
let uninstall = (): void => {};

/**
 * Install the structured console.
 */
const install = (): void => {
  const originalLog = console.log;
  console.log = (message: any, ...additional: any[]): void => {
    const writeThis = restructure("info", message, additional);
    process.stdout.write(writeThis);
    process.stdout.write("\n");
  };
  const originalDebug = console.debug;
  console.debug = (message: any, ...additional: any[]): void => {
    const writeThis = restructure("debug", message, additional);
    process.stdout.write(writeThis);
    process.stdout.write("\n");
  };
  const originalInfo = console.info;
  console.info = (message: any, ...additional: any[]): void => {
    const writeThis = restructure("info", message, additional);
    process.stdout.write(writeThis);
    process.stdout.write("\n");
  };
  const originalWarn = console.warn;
  console.warn = (message: any, ...additional: any[]): void => {
    const writeThis = restructure("warn", message, additional);
    process.stdout.write(writeThis);
    process.stdout.write("\n");
  };
  const originalError = console.error;
  console.error = (message: any, ...additional: any[]): void => {
    const writeThis = restructure("error", message, additional);
    process.stderr.write(writeThis);
    process.stderr.write("\n");
  };
  uninstall = (): void => {
    console.log = originalLog;
    console.debug = originalDebug;
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  };
};

/**
 * Direct acess to the logging methods
 */
export { install, uninstall };
