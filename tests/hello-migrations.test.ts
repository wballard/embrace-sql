import path from "path";
import fs from "fs-extra";
import { loadConfiguration } from "../src/configuration";
import { buildRootContext, RootContext } from "../src/context";
import { migrate } from "../src/migrations";
import rmfr from "rmfr";

describe("hello world of migrations", () => {
  let rootContext: RootContext;
  let root: string;
  beforeAll(async () => {
    root = path.relative(process.cwd(), "./tests/configs/hello-migrations");
    // clean up
    await fs.ensureDir(root);
    await rmfr(root);
  });
  it("will migrate", async () => {
    await fs.ensureDir(path.join(root, "migrations", "default"));
    await fs.writeFile(
      path.join(root, "migrations", "default", "001.sql"),
      `
      CREATE TABLE strings(
        string text PRIMARY KEY
      );
      `
    );
    await fs.writeFile(
      path.join(root, "migrations", "default", "002.sql"),
      `
      INSERT INTO strings(string) VALUES("hello world");
      INSERT INTO strings(string) VALUES("laser power");
      `
    );
    // get the configuration and generate - let's do this just the once
    // and have a few tests that asser things happened
    const configuration = await loadConfiguration(root);
    rootContext = await buildRootContext(configuration);
    await migrate(rootContext);
    // and post migration to query
    // set up
    await fs.ensureDir(path.join(root, "default"));
    await fs.writeFile(
      path.join(root, "default", "hello.sql"),
      "SELECT * FROM strings"
    );
    rootContext = await buildRootContext(configuration);
    const results = await rootContext.databases["default"].execute(
      rootContext.databases["default"].SQLModules["hello"]
    );
    expect(results).toMatchSnapshot();
  });
});
