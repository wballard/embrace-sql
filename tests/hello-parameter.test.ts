import path from "path";
import fs from "fs-extra";
import { loadConfiguration } from "../src/configuration";
import { buildRootContext, RootContext } from "../src/context";
import { createServer } from "../src/server";
import request from "supertest";
import rmfr from "rmfr";

/**
 * Let's make sure we can use a parameter with a pbare query.
 */
describe("hello world with a parameter", () => {
  let rootContext: RootContext;
  beforeAll(async () => {
    const root = path.relative(
      process.cwd(),
      "./tests/configs/hello-parameter"
    );
    // clean up
    await fs.ensureDir(root);
    await rmfr(root);
    // set up
    await fs.ensureDir(path.join(root, "default"));
    await fs.writeFile(
      path.join(root, "default", "hello.sql"),
      "SELECT :stuff as message"
    );
    // get the configuration and generate - let's do this just the once
    // and have a few tests that asser things happened
    const configuration = await loadConfiguration(root);
    rootContext = await buildRootContext(configuration);
  });
  it("will run a query in context", async () => {
    const results = await rootContext.databases["default"].execute(
      rootContext.databases["default"].SQLModules["hello"],
      { stuff: "Whirled" }
    );
    expect(results).toMatchSnapshot();
  });
  it("will make a runnable server", async () => {
    const server = await createServer(rootContext);
    const listening = server.listen(45678);
    try {
      const response = await request(server.callback()).get(
        "/default/hello.sql?stuff=whirled"
      );
      expect(response.text).toMatchSnapshot();
      // client
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { EmbraceSQL } = require(path.join(
        process.cwd(),
        rootContext.configuration.embraceSQLRoot,
        "client"
      ));
      const client = EmbraceSQL("http://localhost:45678");
      expect(
        await client.default.hello.sql({ stuff: "things" })
      ).toMatchSnapshot();
    } finally {
      listening.close();
    }
  });
});
