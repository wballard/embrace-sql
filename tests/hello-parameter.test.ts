import path from "path";
import fs from "fs-extra";
import { loadConfiguration } from "../src/configuration";
import { buildInternalContext, InternalContext } from "../src/context";
import { createServer } from "../src/server";
import request from "supertest";
import rmfr from "rmfr";
import http from "http";

/**
 * Let's make sure we can use a parameter with a pbare query.
 */
describe("hello world with a parameter", () => {
  let rootContext: InternalContext;
  let listening: http.Server;
  let callback;
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
    // get the configuration and generate - let's do this just the once for speed
    const configuration = await loadConfiguration(root);
    rootContext = await buildInternalContext(configuration);
    const server = await createServer(rootContext);
    callback = server.callback();
    listening = server.listen(45678);
  });
  afterAll(async (done) => {
    listening.close(() => done());
  });
  it("will run a query in context", async () => {
    const results = await rootContext.databases["default"].execute(
      rootContext.databases["default"].SQLModules["hello"],
      { stuff: "Whirled" }
    );
    expect(results).toMatchSnapshot();
  });
  it("will make a runnable server - GET", async () => {
    const response = await request(callback).get(
      "/default/hello?stuff=whirled"
    );
    expect(response.text).toMatchSnapshot();
  });
  it("will make a runnable server - POST", async () => {
    const postResponse = await request(callback)
      .post("/default/hello")
      .send({ stuff: "amazing" });
    expect(postResponse.text).toMatchSnapshot();
  });
  it("will make a runnable server - node client", async () => {
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
  });
  it("will make an embeddable engine", async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EmbraceSQL } = require(path.join(
      process.cwd(),
      rootContext.configuration.embraceSQLRoot,
      "client",
      "node-inprocess"
    ));
    const client = EmbraceSQL(rootContext);
    expect(
      await client.databases.default.hello.sql({ stuff: "hole" })
    ).toMatchSnapshot();
  });
});
