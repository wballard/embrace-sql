import path from "path";
import fs from "fs-extra";
import { loadConfiguration } from "../src/configuration";
import { buildInternalContext, InternalContext } from "../src/context";
import { createServer } from "../src/server";
import request from "supertest";
import rmfr from "rmfr";
import { createInProcess } from "../src/inprocess";
import http from "http";

/**
 * Let's make sure we can use a parameter with a pbare query.
 */
describe("hello world with a handler", () => {
  let rootContext: InternalContext;
  let listening: http.Server;
  let callback;
  beforeAll(async () => {
    const root = path.relative(process.cwd(), "./tests/configs/hello-handler");
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
    const server = await createServer(
      rootContext,
      createInProcess(rootContext)
    );
    callback = server.callback();
    listening = server.listen(45679);
  });
  afterAll(async (done) => {
    listening.close(() => done());
  });
  it("will alter a parameter with before and after handlers", async () => {
    const results = await rootContext.databases["default"].execute(
      rootContext.databases["default"].SQLModules["hello"],
      { stuff: "Whirled" }
    );
    expect(results).toMatchSnapshot();
  });
  it("will honor handlers over an HTTP call - GET", async () => {
    const response = await request(callback).get(
      "/default/hello?stuff=whirled"
    );
    expect(response.text).toMatchSnapshot();
  });
  it("will honor handlers over an HTTP call - GET", async () => {
    const postResponse = await request(callback)
      .post("/default/hello")
      .send({ stuff: "amazing" });
    expect(postResponse.text).toMatchSnapshot();
  });
  it("will honor handlers with a client call", async () => {
    // client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EmbraceSQL } = require(path.join(
      process.cwd(),
      rootContext.configuration.embraceSQLRoot,
      "client",
      "node"
    ));
    const client = EmbraceSQL("http://localhost:45679");
    expect(
      await client.databases.default.hello.sql({ stuff: "nodey thing" })
    ).toMatchSnapshot();
  });
  it("will honor handlers with an embeddable engine", async () => {
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
