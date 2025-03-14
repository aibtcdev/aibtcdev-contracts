import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { SBTC_CONTRACT } from "../../test-utilities";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractName = "aibtc-token-dex";
const contractAddress = `${deployer}.${contractName}`;

const tokenContractName = "aibtc-token";
const tokenContractAddress = `${deployer}.${tokenContractName}`;

describe(`token: ${contractName}`, () => {
  it("buy() succeeds and transfers token to buyer", () => {
    const buyAmount = 100000; // 0.001 BTC
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      address1
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(buyAmount)],
      address1
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
});
