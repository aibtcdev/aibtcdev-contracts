import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-bank-account-deposit-stx";
const contractAddress = `${deployer}.${contractName}`;

// normally would succeed (anyone can call)
// fails because contract has no funds to deposit
const expectedErr = Cl.uint(4);

describe(contractName, () => {
  it("execute() fails if called directly", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "execute",
      [Cl.principal(deployer)],
      deployer
    );
    expect(receipt.result).toBeErr(expectedErr);
  });
});
