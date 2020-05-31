import path from "path";
import fs from "fs-extra";
import { loadConfiguration } from "../src/configuration";
import { buildInternalContext, InternalContext } from "../src/context";
import { createServer } from "../src/server";
import request from "supertest";
import rmfr from "rmfr";
import http from "http";

/**
 * Let's test handlers. These rely on generated code, so the internal context
 * needs to be decorated with the handlers.
 *
 * The setup in beforeAll is a rough simulation of using the system there is a context
 * and directory, with some custom code inserted into handlers.
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
    // before handlers are exciting, as noted by three exclamation points added to the parameter
    await fs.writeFile(
      path.join(root, "default", "hello.sql.before.ts"),
      `
/* eslint-disable @typescript-eslint/camelcase */
import * as types from "../context";

export const before: types.default_helloHandler = async (context) => {
  context.parameters.stuff = context.parameters.stuff + "!!!";
  return context;
};
      `
    );
    // double results === double fun
    await fs.writeFile(
      path.join(root, "default", "hello.sql.after.ts"),
      `
/* eslint-disable @typescript-eslint/camelcase */
import * as types from "../context";

export const after: types.default_helloHandler = async (context) => {
  context.results = [
    ...context.results,
    ...context.results,
  ];
  return context;
};
      `
    );
    // error handling
    await fs.writeFile(
      path.join(root, "default", "hello.sql.afterError.ts"),
      `
/* eslint-disable @typescript-eslint/camelcase */
import * as types from "../context";

export const afterError: types.default_helloHandler = async (context) => {
  return context;
};
      `
    );
    // folder before
    await fs.writeFile(
      path.join(root, "default", "before.ts"),
      `
/* eslint-disable @typescript-eslint/camelcase */
import * as types from "../context";

export const before: types.FolderHandler = async (context) => {
  // simulated error
  if (context.parameters.stuff === "error") {
    throw new Error("Simulated Error");
  }
  return context;
};

      `
    );
    // folder after
    await fs.writeFile(
      path.join(root, "default", "after.ts"),
      `
/* eslint-disable @typescript-eslint/camelcase */
import * as types from "../context";

export const after: types.FolderHandler = async (context) => {
  // even MOAR results
  context.results = [...context.results, ...context.results];
  return context;
};

      `
    );
    // get the configuration and generate - let's do this just the once for speed
    const configuration = await loadConfiguration(root);
    rootContext = await buildInternalContext(configuration);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { decorateInternalContext } = require(path.join(
      process.cwd(),
      rootContext.configuration.embraceSQLRoot,
      "context"
    ));
    const server = await createServer(decorateInternalContext(rootContext));
    callback = server.callback();
    listening = server.listen(45679);
    // non logging
    rootContext.configuration.logLevels = [];
  });
  afterAll(async (done) => {
    listening.close(() => done());
  });
  it("will honor handlers over an HTTP call - GET", async () => {
    const response = await request(callback).get(
      "/default/hello?stuff=whirled"
    );
    expect(response.text).toMatchSnapshot();
  });
  it("will honor handlers over an HTTP call - POST", async () => {
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
    const client = EmbraceSQL(rootContext);
    expect(
      await client.databases.default.hello.sql({ stuff: "hole" })
    ).toMatchSnapshot();
  });
  it("will return errors via HTTP - GET", async () => {
    const response = await request(callback).get("/default/hello?stuff=error");
    expect({ status: response.status, text: response.text }).toMatchSnapshot();
  });
  it("will return errors via HTTP - POST", async () => {
    const response = await request(callback)
      .post("/default/hello")
      .send({ stuff: "error" });
    expect({ status: response.status, text: response.text }).toMatchSnapshot();
  });
  it("will throw errors back out to the client", async () => {
    // client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EmbraceSQL } = require(path.join(
      process.cwd(),
      rootContext.configuration.embraceSQLRoot,
      "client",
      "node"
    ));
    const client = EmbraceSQL("http://localhost:45679");
    // simulated error throw
    expect(
      client.databases.default.hello.sql({ stuff: "error" })
    ).rejects.toMatchSnapshot();
  });
});
