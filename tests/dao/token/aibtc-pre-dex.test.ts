import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractName = "aibtc-pre-dex";
const contractAddress = `${deployer}.${contractName}`;

describe(`token: ${contractName}`, () => {
  it("get-contract-status() should return the contract status", () => {
    // arrange
    const expectedObject = Cl.tuple({
      "accelerated-vesting": Cl.bool(false),
      "deployment-height": Cl.uint(5), // hardcoded for now
      "distribution-height": Cl.uint(0),
      "expiration-period": Cl.uint(2100),
      "governance-active": Cl.bool(false),
      "market-open": Cl.bool(false),
      "seat-holders": Cl.list([]),
      "is-period-1-expired": Cl.bool(false),
      "is-distribution-period": Cl.bool(false),
      "total-users": Cl.uint(0),
      "total-seats-taken": Cl.uint(0),
    });
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-status",
      [],
      deployer
    ).result;
    expect(result).toBeOk(expectedObject);
  });
});
