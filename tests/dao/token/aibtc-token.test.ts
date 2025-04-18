import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ResponseOkCV } from "@stacks/stacks-transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractName = "aibtc-token";
const contractAddress = `${deployer}.${contractName}`;
const tokenOwnerAddress = `${deployer}.aibtc-token-owner`;
const treasuryAddress = `${deployer}.aibtc-treasury`;

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

  it("get-name() should return the token name", () => {
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-name",
      [],
      deployer
    ).result;
    expect(result).toBeOk(Cl.stringAscii("SYMBOL-AIBTC-DAO"));
  });

  it("get-decimals() should return the token decimals", () => {
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-decimals",
      [],
      deployer
    ).result;
    expect(result).toBeOk(Cl.uint(8));
  });

  it("get-total-supply() should return the total supply", () => {
    const expectedTotalSupply = 100000000000000000n;
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-supply",
      [],
      deployer
    ).result;
    expect(result).toBeOk(Cl.uint(expectedTotalSupply));
  });

  it("get-token-uri() should return the token URI", () => {
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-token-uri",
      [],
      deployer
    ).result;
    // The token URI is set in the contract initialization
    expect(result).toBeOk(Cl.some(Cl.stringUtf8("")));
  });

  it("get-balance() should return the balance for an account", () => {
    // Check treasury balance (should have 80% of total supply)
    const totalSupply = 100000000000000000n;
    const expectedTreasuryBalance = (totalSupply * 80n) / 100n;
    
    const treasuryBalanceResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(treasuryAddress)],
      deployer
    ).result;
    
    expect(treasuryBalanceResult).toBeOk(Cl.uint(expectedTreasuryBalance));
    
    // Check a user with no balance
    const userBalanceResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;
    
    expect(userBalanceResult).toBeOk(Cl.uint(0));
  });
});
