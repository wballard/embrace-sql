/* eslint-disable @typescript-eslint/no-explicit-any */
import process from "process";
import callsites from "callsites";
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
 * And a structured log message.
 */
type LogMessage = {
  logLevel: LogLevel;
  source: string;
  message: any;
  additional: any[];
};

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
): LogMessage => {
  const call = callsites();
  return {
    logLevel,
    source: `${call[2].getFileName()}#${call[2].getLineNumber()}`,
    message,
    additional,
  };
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
    const writeThis = JSON.stringify(restructure("info", message, additional));
    process.stdout.write(writeThis);
  };
  const originalDebug = console.debug;
  console.debug = (message: any, ...additional: any[]): void => {
    const writeThis = JSON.stringify(restructure("debug", message, additional));
    process.stdout.write(writeThis);
  };
  const originalInfo = console.info;
  console.info = (message: any, ...additional: any[]): void => {
    const writeThis = JSON.stringify(restructure("info", message, additional));
    process.stdout.write(writeThis);
  };
  const originalWarn = console.warn;
  console.warn = (message: any, ...additional: any[]): void => {
    const writeThis = JSON.stringify(restructure("warn", message, additional));
    process.stdout.write(writeThis);
  };
  const originalError = console.error;
  console.error = (message: any, ...additional: any[]): void => {
    const writeThis = JSON.stringify(restructure("error", message, additional));
    process.stderr.write(writeThis);
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
export default {
  install,
  uninstall,
};
