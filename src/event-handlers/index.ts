import { RootContext } from "../context";
import readFile from "read-file-utf8";
import walk from "ignore-walk";
import path from "path";
import md5 from "md5";
import sqlModulePipeline from "./sqlmodule-pipeline";
import contextPipeline from "./context-pipeline";
import { SQLModule } from "../database-engines";

/**
 * Scrub up identifiers to be valid JavaScript names.
 */
export const identifier = (key: string): string => {
  const id = key
    .trim()
    // quotes won't do
    .replace(/['"]+/g, "")
    // snake case
    .replace(/\W+/g, "_");
  return /^\d/.test(id) ? "_" + id : id;
};

/**
 * Manage a directory of event handlers, which form the basis of APIs
 *
 * All SQL files in the directory serve as entry points. The process is to enumerate
 * all of these SQL files and build an in memory file system analog with hashes
 * to be used as cache keys.
 *
 * * Loads up and hashes all sql files found
 * * Creates a database specific wrapper for invoking each SQL.
 * * Makes sure all the needed event handlers are generated
 *
 * @param rootContext - like other internal methods, run off the root context
 */
export const embraceEventHandlers = async (
  rootContext: RootContext
): Promise<RootContext> => {
  // this should be the only place where a file walk happens
  const fileNames = await walk({
    path: rootContext.configuration.embraceSQLRoot,
  });
  // just the SQL files
  const sqlFileNames = await fileNames.filter((fileName) =>
    fileName.toLowerCase().endsWith(".sql")
  );
  // root folders are databases, so attach there
  const sqlModules = await sqlFileNames.map(async (SQLFileName) => {
    const parsedPath = path.parse(SQLFileName);
    const segments = parsedPath.dir
      .split(path.sep)
      .map((segment) => identifier(segment));
    // database is the first segment
    const databaseName = segments[0];
    // tail end of the path after the database, cleaned up names
    // to be identifiers -- path separator in the URl style
    const pathAfterDatabase = [...segments.slice(1), parsedPath.name]
      .map(identifier)
      .join("/");
    // working with full paths from here on out, one less thing to worry about
    const fullPath = path.join(
      rootContext.configuration.embraceSQLRoot,
      SQLFileName
    );
    const relativePath = SQLFileName;
    // get all the 'read' IO done
    const sql = await readFile(fullPath);
    // data about each SQL module
    const sqlModule = {
      database: rootContext.databases[databaseName],
      relativePath,
      fullPath,
      sql,
      cacheKey: md5(sql),
      contextName: identifier(path.join(parsedPath.dir, parsedPath.name)),
    };
    rootContext.databases[databaseName].SQLModules = new Map<
      string,
      SQLModule
    >();
    rootContext.databases[databaseName].SQLModules[
      pathAfterDatabase
    ] = sqlModule;
    return sqlModule;
  });
  // every module through the compiler pipeline, so compile them all
  const compiledSQLModules = await sqlModules.map(async (sqlModule) =>
    sqlModulePipeline(rootContext, await sqlModule)
  );
  // let them all finish
  await Promise.all(compiledSQLModules);
  // stitch together the full context and final combined files
  // this is the 'pack' phase
  await contextPipeline(rootContext);
  return rootContext;
};
