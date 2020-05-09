import path from "path";
/**
 * Hello world type tests, make sure the core configuration
 * and generation capabilities are working.
 */
describe("hello world configuration!", async () => {
  beforeAll(async () => {
    process.env["EMBRACESQL_ROOT"] = path.join(__dirname, "./hello");
    //delete the generated files
  });
  //       expect(result).toMatchSnapshot();
  it("reads a config and starts", async () => {});
  it("makes a sqlite database for you", async () => {});
  it("makes empty handlers for you", async () => {});
  it("generates an open api doc", async () => {});
  it("generates client library for you", async () => {});
  it("will say hello", async () => {});

  afterAll(async () => {
    //delete the generated files
  });
});
