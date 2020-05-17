import Url from "url-parse";
import { Configuration } from "../configuration";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { SQLModule, SQLType } from "../shared-context";
import { DatabaseInternal } from "../context";
import { Parser } from "node-sql-parser";
import md5 from "md5";
import { identifier } from "../event-handlers";

/**
 * Map SQLite to our neutral type strings.
 */
const typeMap = (fromSQLite: string): SQLType => {
  switch (fromSQLite) {
    default:
      return "string";
  }
};

/**
 * Embrace SQLite. Open it up and read the schema. This will create a database
 * if it does not exist.
 *
 * SQLite is a local file, so not a whole lot can go wrong. Except that a local file
 * can actually be a network file - so everything can go wrong...
 */
export default async (
  configuration: Configuration,
  db: Url
): Promise<DatabaseInternal> => {
  const filename = path.isAbsolute(db.pathname)
    ? db.pathname
    : path.normalize(path.join(configuration.embraceSQLRoot, db.pathname));
  // SQLite -- open is connection
  const database = await open({
    filename,
    driver: sqlite3.Database,
  });
  const transactions = {
    begin: async (): Promise<void> => {
      database.run("BEGIN IMMEDIATE TRANSACTION");
    },
    commit: async (): Promise<void> => {
      database.run("COMMIT");
    },
    rollback: async (): Promise<void> => {
      database.run("ROLLBACK");
    },
  };
  // TODO -- do we need SAVEPOINT / nesting?
  return {
    transactions,
    SQLModules: new Map<string, SQLModule>(),
    execute: async (
      sqlModule: SQLModule,
      parameters: object
    ): Promise<Array<object>> => {
      const statement = await database.prepare(sqlModule.sql);
      if (parameters && Object.keys(parameters).length) {
        throw Error("TODO");
      } else {
        return await statement.all();
      }
    },
    analyze: async (sqlModule: SQLModule): Promise<object> => {
      /**
       * This is a bit involved, taking each select, making a
       * temp table from it, inspecting -- and rolling the whole
       * thing back.
       */
      sqlModule.resultsetMetadata = [];
      const parser = new Parser();
      await Promise.all(
        sqlModule.ast
          ?.filter((ast) => ast.type === "select")
          .map(async (ast) => {
            const sql = parser.sqlify(ast);
            const create = `CREATE TABLE ${md5(sql)} AS ${sql};`;
            const describe = `pragma table_info('${md5(sql)}')`;
            try {
              await database.run(create);
              const describeStatement = await database.prepare(describe);
              const readDescribeRows = await describeStatement.all();
              // OK so something to know -- columns with spaces in them are quoted
              // by sqlite so if a column is named
              // hi mom
              // sqlite has that as 'hi mom'
              // which makes the javascript key ...["'hi mom'"] -- oh yeah
              // the ' is part of the key

              /**
               * One row per column, the name and type info are interesting,
               * pick them out and normalize them.
               */
              sqlModule.resultsetMetadata.push(
                readDescribeRows.map((row) => ({
                  name: identifier(row.name.toString()),
                  type: typeMap(row.type),
                }))
              );
            } catch (e) {
              console.error(e);
            }
          })
      );
      return {};
    },
  };
};
