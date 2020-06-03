import init from "../src/cli/init";
import embedded from "../src/cli/embedded";
import migrate from "../src/cli/migrate";
import sinon from "sinon";
import path from "path";
import readFile from "read-file-utf8";

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
  it("generates an embedded client", async () => {
    const root = path.resolve(path.join(__dirname, "..", ".tests", "embedded"));
    const command = await embedded.parseAsync([
      "node",
      "embedded",
      root,
      "--nowatch",
    ]);
    // trick needed to wait out
    await Promise.all(command.parent?._actionResults || []);
    expect(command.args).toMatchSnapshot();
    // check on the key files
    expect(await readFile(path.join(root, "index.ts"))).toMatchSnapshot();
  });
  it("migrates", async () => {
    const root = path.resolve(path.join(__dirname, "..", ".tests", "migrate"));
    const spy = sandbox.spy(console, "info");
    const command = await migrate.parseAsync(["node", "migrate", root]);
    // trick needed to wait out
    await Promise.all(command.parent?._actionResults || []);
    const output = spy.getCall(0).args[0];
    expect(output).toMatchSnapshot();
    // and some files to exist
    expect(await readFile(path.join(root, "index.ts"))).toMatchSnapshot();
  });
});
