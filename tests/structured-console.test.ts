import stdMocks from "std-mocks";
import sc from "../src/structured-console";

describe("structured console logging", () => {
  it("exists", () => {
    expect(sc).toBeTruthy();
  });
  it("captures log", async () => {
    stdMocks.use();
    console.log("Hello World");
    stdMocks.restore();
    expect(stdMocks.flush()).toMatchSnapshot();
  });
  it("captures debug", async () => {
    stdMocks.use();
    console.debug("Hello World");
    stdMocks.restore();
    expect(stdMocks.flush()).toMatchSnapshot();
  });
  it("captures info", async () => {
    stdMocks.use();
    console.info("Hello World");
    stdMocks.restore();
    expect(stdMocks.flush()).toMatchSnapshot();
  });
  it("captures warn", async () => {
    stdMocks.use();
    console.warn("Hello World");
    stdMocks.restore();
    expect(stdMocks.flush()).toMatchSnapshot();
  });
  it("captures error", () => {
    stdMocks.use();
    console.error("Hello World");
    stdMocks.restore();
    expect(stdMocks.flush()).toMatchSnapshot();
  });
});
