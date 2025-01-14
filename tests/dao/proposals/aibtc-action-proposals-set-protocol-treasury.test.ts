import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.aibtc-action-add-resource`;

describe("aibtc-action-proposals-set-protocol-treasury", () => {
  it("execute() should fail if called directly", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "execute",
      [Cl.principal(deployer)],
      deployer
    );
    expect(callback.result).toBeErr();
  });
});
