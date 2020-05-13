import { RootContext } from "../context";
import readFile from "read-file-utf8";
import walk from "ignore-walk";
import path from "path";
import { SQLModule } from "../database-engines";
import md5 from "md5";
import sqlModuleMap from "../event-handlers/sqlmodule-pipeline";

/**
 * Scrub up identifiers to be valid JavaScript names.
 */
function identifier(key: string): string {
  const id = key.trim().replace(/\W+/g, "_");
  return /^\d/.test(id) ? "_" + id : id;
}

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
    // module == sql file root, sorta like js modules without the js
    const module = identifier(parsedPath.name);
    // reduce down the file path into hashes, come back with the path
    // end so we can attach the actual SQL
    const pathEnd = segments
      .slice(1)
      .reduce<Map<string, string | SQLModule>>(
        (attachTo, segment) =>
          (attachTo[segment] =
            attachTo[segment] || new Map<string, string | SQLModule>()),
        rootContext.databases[databaseName].SQLModules
    );
    // working with full paths from here on out, one less thing to worry about
    const fullPath = path.join(
      rootContext.configuration.embraceSQLRoot,
      SQLFileName
    );
    // get all the 'read' IO done
    const sql = await readFile(fullPath);
    const sqlModule = {
      fullPath,
      sql,
      cacheKey: md5(sql),
    };
    pathEnd[module] = sqlModule;
    return sqlModule;
  });
  // every module through the compiler pipeline, so compile them all
  const compiledSQLModules = await sqlModules.map(async (sqlModule) =>
    sqlModuleMap(rootContext, await sqlModule)
  );
  // let them all finish
  await Promise.all(compiledSQLModules);
  // TODO: build the overall context
  return rootContext;
};
