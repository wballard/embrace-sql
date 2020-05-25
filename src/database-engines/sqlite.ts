import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { SQLModule, SQLType, SQLColumnMetadata } from "../shared-context";
import { DatabaseInternal } from "../context";
import { Parser, TableColumnAst } from "node-sql-parser";
import { identifier } from "../event-handlers";
import { SQLModuleInternal } from "../event-handlers/sqlmodule-pipeline";
import { RootContext } from "../context";

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
  rootContext: RootContext,
  databaseName: string
): Promise<DatabaseInternal> => {
  const dbUrl = rootContext.configuration?.databases[databaseName];
  const filename = path.isAbsolute(dbUrl.pathname)
    ? dbUrl.pathname
    : path.normalize(
        path.join(rootContext.configuration.embraceSQLRoot, dbUrl.pathname)
      );
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
    name: databaseName,
    transactions,
    SQLModules: new Map<string, SQLModule>(),
    parse: (sqlModule: SQLModule): TableColumnAst => {
      const parser = new Parser();
      const parsed = parser.parse(sqlModule.sql, { database: "postgresql" });
      return parsed;
    },
    execute: async (
      sqlModule: SQLModule,
      parameters: object
    ): Promise<Array<object>> => {
      const statement = await database.prepare(sqlModule.sql);
      if (parameters && Object.keys(parameters).length) {
        // map to SQLite names
        const withParameters = Object.fromEntries(
          Object.keys(parameters).map((name) => [`:${name}`, parameters[name]])
        );
        statement.bind(withParameters);
        return await statement.all();
      } else {
        return await statement.all();
      }
    },
    analyze: async (
      sqlModule: SQLModuleInternal
    ): Promise<Array<SQLColumnMetadata>> => {
      /**
       * This is a bit involved, taking each select, making a
       * temp table from it, inspecting -- and rolling the whole
       * thing back.
       */
      sqlModule.resultsetMetadata = [];

      if (sqlModule.ast?.type === "select") {
        const parser = new Parser();
        const sql = parser.sqlify(sqlModule.ast, { database: "postgresql" });
        const create = `CREATE TABLE __analyze__ AS ${sql};`;
        const drop = `DROP TABLE __analyze__;`;
        const preparedCreate = await database.prepare(create);
        const describe = `pragma table_info('__analyze__')`;
        // run with all nulls for all parameters by default
        if (sqlModule.namedParameters?.length) {
          const withParameters = Object.fromEntries(
            sqlModule.namedParameters?.map((p) => [`:${p.name}`, null])
          );
          await preparedCreate.bind(withParameters);
          await preparedCreate.all();
        } else {
          await preparedCreate.all();
        }
        const readDescribeRows = await database.all(describe);
        await database.all(drop);
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
        return readDescribeRows.map((row) => ({
          name: identifier(row.name.toString()),
          type: typeMap(row.type),
        }));
      } else {
        return [];
      }
    },
  };
};
