import path from "path";
import fs from "fs-extra";
import { loadConfiguration } from "../src/configuration";
import { buildRootContext, RootContext } from "../src/context";
import { createServer } from "../src/server";
import request from "supertest";
import rmfr from "rmfr";
import { createInProcess } from "../src/inprocess";

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
  it("will make a runnable server - GET", async () => {
    const server = await createServer(
      rootContext,
      createInProcess(rootContext)
    );
    const listening = server.listen(45678);
    try {
      const response = await request(server.callback()).get(
        "/default/hello?stuff=whirled"
      );
      expect(response.text).toMatchSnapshot();
    } finally {
      listening.close();
    }
  });
  it("will make a runnable server - POST", async () => {
    const server = await createServer(
      rootContext,
      createInProcess(rootContext)
    );
    const listening = server.listen(45678);
    try {
      const postResponse = await request(server.callback())
        .post("/default/hello")
        .send({ stuff: "amazing" });
      expect(postResponse.text).toMatchSnapshot();
    } finally {
      listening.close();
    }
  });
  it("will make a runnable server - node client", async () => {
    const server = await createServer(
      rootContext,
      createInProcess(rootContext)
    );
    const listening = server.listen(45678);
    try {
      // client
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { EmbraceSQL } = require(path.join(
        process.cwd(),
        rootContext.configuration.embraceSQLRoot,
        "client",
        "node"
      ));
      const client = EmbraceSQL("http://localhost:45678");
      expect(
        await client.databases.default.hello.sql({ stuff: "nodey thing" })
      ).toMatchSnapshot();
    } finally {
      listening.close();
    }
  });
  it("will make an embeddable engine", async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EmbraceSQL } = require(path.join(
      process.cwd(),
      rootContext.configuration.embraceSQLRoot,
      "client",
      "node-inprocess"
    ));
    const client = EmbraceSQL(createInProcess(rootContext));
    expect(
      await client.databases.default.hello.sql({ stuff: "hole" })
    ).toMatchSnapshot();
  });
});
