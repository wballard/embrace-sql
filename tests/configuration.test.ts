import path from "path";
import fs from "fs";
import {
  loadConfiguration,
  Configuration,
  buildRootContext,
} from "../src/configuration";
const debug = require("debug")("embracesql:test");
/**
 * Hello world type tests, make sure the core configuration
 * and generation capabilities are working.
 *
 * This doesn't actually test that a server runs, or that you can
 * call APIs, -- just that configuration worked at all.
 */
describe("hello world configuration!", () => {
  let theConfig: Configuration = undefined;
  beforeAll(async () => {
    const root = (process.env["EMBRACESQL_ROOT"] = path.join(
      __dirname,
      "./hello"
    ));
    //we only want the config in here
    const trash = fs.readdirSync(root).filter((f) => f != "embracesql.yaml");
    trash.forEach((f) => fs.unlinkSync(path.join(root, f)));
    // get the configuration and generate - let's do this just the once
    // and have a few tests that asser things happened
    const configuration = await loadConfiguration();
    debug(configuration);
    theConfig = configuration;
    const rootContext = buildRootContext(configuration);
    debug(rootContext);
  });
  it("reads a config", async () => {
    expect(theConfig).toMatchSnapshot();
  });
  it("makes a sqlite database for you", async () => {
    expect(
      fs.existsSync(
        path.join(
          theConfig.embraceSQLRoot,
          theConfig.databases["default"].pathname
        )
      )
    ).toBeTruthy();
  });
  it("makes a hello world sql for you", async () => {});
  it("makes empty handlers for you", async () => {});
  it("generates an open api doc", async () => {});
  it("generates client library for you", async () => {});

  afterAll(async () => {});
});
