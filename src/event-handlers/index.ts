import { RootContext } from "../context";
import { Parser } from "node-sql-parser";
import readFile from "read-file-utf8";
import { generateFromTemplates } from "../generator";
import walk from "ignore-walk";
import path from "path";
import { SQLModule } from "../database-engines";
import md5 from "md5";

/**
 * Scrub up identifiers.
 */
function identifier(key: string): string {
  const id = key.trim().replace(/\W+/g, "_");
  return /^\d/.test(id) ? "_" + id : id;
}

/**
 * Every sql file needs its handlers.
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
const ensureHandlersExist = async (
  rootContext: RootContext,
  SQLFileName: string
): Promise<RootContext> => {
  // what the hell -- parse the SQL and see if it is SQL!
  const isThisReallySQL = await readFile(SQLFileName);
  const { ast } = new Parser().parse(isThisReallySQL);
  // smells like SQLSpirit...
  if (ast) {
    await generateFromTemplates(
      Object.assign({}, rootContext, { SQLFileName }),
      "handlers/js"
    );
  }
  return rootContext;
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
  await walk({ path: rootContext.configuration.embraceSQLRoot })
    // just the SQL files
    .then((fileNames) =>
      fileNames.filter((fileName) => fileName.toLowerCase().endsWith(".sql"))
    )
    // root folders are databases, so attach there
    .then(async (SQLFileNames) => {
      return SQLFileNames.map(async (SQLFileName) => {
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
        const fullPath = path.join(
          rootContext.configuration.embraceSQLRoot,
          SQLFileName
        );
        const sql = await readFile(fullPath);
        const sqlFile = {
          fullPath,
          sql,
          cacheKey: md5(sql),
        };
        pathEnd[module] = sqlFile;
        return sqlFile;
      });
    })
    .then((_) => Promise.all(_))
    // handers for every SQL need to be on disk
    .then(async (SQLModules) =>
      SQLModules.map((SQLModule) =>
        ensureHandlersExist(rootContext, SQLModule.fullPath)
      )
    )
    // let them all finish
    .then((_) => Promise.all(_));
  return rootContext;
};
