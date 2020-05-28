import { RootContext } from "./context";
import path from "path";
import walk from "ignore-walk";
import readFile from "read-file-utf8";

/**
 * Run migrations for all databases. Each database is contained in its
 * own transaction.
 */
export const migrate = async (rootContext: RootContext): Promise<void> => {
  for (const databaseName of Object.keys(rootContext.databases)) {
    const migrationPath = path.join(
      rootContext.configuration.embraceSQLRoot,
      "migrations",
      databaseName
    );
    const migrationFileNames = walk({ path: migrationPath });
    const migrationFiles = (await migrationFileNames)
      .map((fileName) => path.join(migrationPath, fileName))
      .map(async (fullMigrationFilename) => ({
        name: fullMigrationFilename,
        content: (await readFile(fullMigrationFilename)).trim(),
      }));
    await rootContext.databases[databaseName].migrate(
      await Promise.all(migrationFiles)
    );
  }
};
