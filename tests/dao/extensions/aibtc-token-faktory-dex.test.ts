import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractName = "aibtc-token-faktory-dex";
const contractAddress = `${deployer}.${contractName}`;

const tokenContractName = "aibtc-token-faktory";
const tokenContractAddress = `${deployer}.${tokenContractName}`;

describe(`extension: ${contractName}`, () => {
  it("buy() succeeds and transfers token to buyer", () => {
    const buyAmount = 1000000; // 1 STX
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(buyAmount)],
      address1
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
});
