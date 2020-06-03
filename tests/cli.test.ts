import init from "../src/cli/init";
import sinon from "sinon";

describe("CLI", () => {
  const sandbox = sinon.createSandbox();
  beforeEach(() => {});
  afterEach(() => {
    sandbox.restore();
  });
  it("initializes", async () => {
    const spy = sandbox.spy(process.stdout, "write");
    const command = await init.parseAsync(["node", "init"]);
    // trick needed to wait out
    await Promise.all(command.parent?._actionResults || []);
    expect(command.args).toMatchSnapshot();
    const output = spy.getCall(0).args[0];
    expect(output).toMatchSnapshot();
  });
});
