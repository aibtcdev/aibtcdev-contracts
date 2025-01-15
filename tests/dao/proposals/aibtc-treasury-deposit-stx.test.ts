import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCode } from "../extensions/aibtc-treasury.test";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-treasury-deposit-stx";
const contractAddress = `${deployer}.${contractName}`;

describe(`core proposal: ${contractName}`, () => {
  it("execute() succeeds if called directly (open to anyone)", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "execute",
      [Cl.principal(deployer)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
});
