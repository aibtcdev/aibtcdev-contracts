import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractName = "aibtc-token";
const contractAddress = `${deployer}.${contractName}`;

describe(`token: ${contractName}`, () => {
  it("get-symbol() should return the token symbol", () => {
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-symbol",
      [],
      deployer
    ).result;
    expect(result).toBeOk(Cl.stringAscii("SYMBOL-AIBTC-DAO"));
  });
});
