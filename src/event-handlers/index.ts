import { RootContext } from "../configuration";
import { Parser } from "node-sql-parser";
import readFile from "read-file-utf8";
import { generateFromTemplates } from "../generator";
import walk from "ignore-walk";
import path from "path";

/**
 * Every sql file needs its handlers.
 *
 * @rootContext - as usual, our root context
 * @param SQLFileName - full file path to a single SQL
 */
const ensureHandlersExist = async (
  rootContext: RootContext,
  SQLFileName: string
) => {
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
};

/**
 * Manage a directory of event handlers.
 *
 * This makes sure all the needed event handlers are generated, and registered
 * to receive events.
 *
 * @param rootContext - like other internal methods, run off the root context
 */
export default async (rootContext: RootContext) => {
  await walk({ path: rootContext.configuration.embraceSQLRoot })
    .then((fileNames) =>
      fileNames.filter((fileName) => fileName.toLowerCase().endsWith(".sql"))
    )
    .then((SQLFileNames) =>
      SQLFileNames.map((SQLFileName) =>
        path.join(rootContext.configuration.embraceSQLRoot, SQLFileName)
      )
    )
    // handers for every SQL
    .then(async (SQLFileNames) =>
      SQLFileNames.map((SQLFileName) =>
        ensureHandlersExist(rootContext, SQLFileName)
      )
    )
    // let them all finish
    .then((_) => Promise.all(_));
};
