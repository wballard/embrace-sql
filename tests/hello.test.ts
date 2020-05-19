/* eslint-disable @typescript-eslint/no-namespace */
import path from "path";
import fs from "fs-extra";
import { loadConfiguration, Configuration } from "../src/configuration";
import { buildRootContext, RootContext } from "../src/context";
import { createServer } from "../src/server";
import request from "supertest";
import readFile from "read-file-utf8";

declare global {
  namespace jest {
    interface Matchers<R> {
      toExist(): R;
    }
  }
}

/**
 * Hello world type tests, make sure the core configuration
 * and generation capabilities are working.
 *
 * This doesn't actually test that a server runs, or that you can
 * call APIs, -- just that configuration worked at all.
 */
describe("hello world configuration!", () => {
  let theConfig: Configuration = undefined;
  let rootContext: RootContext;
  beforeAll(async () => {
    const root = (process.env["EMBRACESQL_ROOT"] = path.join(
      __dirname,
      "./configs/hello"
    ));
    // clean up
    await fs.emptyDir(root);
    // get the configuration and generate - let's do this just the once
    // and have a few tests that asser things happened
    const configuration = await loadConfiguration();
    theConfig = configuration;
    rootContext = await buildRootContext(configuration);
  });
  expect.extend({
    toExist(fileName) {
      const fullPath = path.join(theConfig.embraceSQLRoot, fileName);
      const exists = fs.existsSync(fullPath);
      return exists
        ? { message: (): string => `${fullPath} exists`, pass: true }
        : { message: (): string => `${fullPath} does not exist`, pass: false };
    },
  });
  it("reads a config", async () => {
    expect(theConfig).toMatchSnapshot();
  });
  it("makes a default config for you", async () => {
    expect("embracesql.yaml").toExist();
  });
  it("makes a sqlite database for you", async () => {
    expect(theConfig.databases["default"].pathname).toExist();
  });
  it("makes a hello world sql for you", async () => {
    expect("default/hello.sql").toExist();
  });
  it("makes empty handlers for you", async () => {
    expect("default/hello.sql.beforeBatch.js").toExist();
    expect("default/hello.sql.before.js").toExist();
    expect("default/hello.sql.after.js").toExist();
    expect("default/hello.sql.afterBatch.js").toExist();
    expect("default/hello.sql.afterError.js").toExist();
  });
  it("exposes methods to run hello sql", async () => {
    expect(
      rootContext.databases["default"].SQLModules.hello.sql
    ).toMatchSnapshot();
  });
  it("generates an open api doc", async () => {
    expect("openapi.yaml").toExist();
    const content = await readFile(
      path.join(theConfig.embraceSQLRoot, "openapi.yaml")
    );
    expect(content).toMatchSnapshot();
  });
  it("generates a typed context object", async () => {
    expect("context.ts").toExist();
  });
  it("generates client library for you", async () => {
    expect("client.ts").toExist();
  });
  it("will run a query in context", async () => {
    const results = await rootContext.databases["default"].execute(
      rootContext.databases["default"].SQLModules["hello"]
    );
    expect(results).toMatchSnapshot();
  });
  it("will make a runnable server", async () => {
    const server = await createServer(rootContext);
    const listening = server.listen(4567);
    try {
      const response = await request(server.callback()).get(
        "/default/hello.sql"
      );
      expect(response.text).toMatchSnapshot();
    } finally {
      listening.close();
    }
  });
});
