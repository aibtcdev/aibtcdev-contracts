import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { TimedVaultErrCode } from "../../error-codes";
import { ContractType } from "../../dao-types";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.${ContractType.DAO_TIMED_VAULT_SBTC}`;

const ErrCode = TimedVaultErrCode;

const withdrawalAmount = 10000000; // 10 sBTC (in sats)
const withdrawalPeriod = 144; // 144 blocks

describe(`public functions: ${ContractType.DAO_TIMED_VAULT_SBTC}`, () => {
  ////////////////////////////////////////
  // callback() tests
  ////////////////////////////////////////
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });
  ////////////////////////////////////////
  // set-account-holder() tests
  ////////////////////////////////////////
  it("set-account-holder() fails if called directly", () => {
    const setAccountHolder = simnet.callPublicFn(
      contractAddress,
      "set-account-holder",
      [Cl.principal(address1)],
      deployer
    );
    expect(setAccountHolder.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ///////////////////////////////////////////
  // set-withdrawal-period() tests
  ///////////////////////////////////////////
  it("set-withdrawal-period() fails if called directly", () => {
    const setWithdrawalPeriod = simnet.callPublicFn(
      contractAddress,
      "set-withdrawal-period",
      [Cl.uint(withdrawalPeriod)],
      deployer
    );
    expect(setWithdrawalPeriod.result).toBeErr(
      Cl.uint(ErrCode.ERR_UNAUTHORIZED)
    );
  });
  ///////////////////////////////////////////
  // set-withdrawal-amount() tests
  ///////////////////////////////////////////
  it("set-withdrawal-amount() fails if called directly", () => {
    const setWithdrawalAmount = simnet.callPublicFn(
      contractAddress,
      "set-withdrawal-amount",
      [Cl.uint(withdrawalAmount)],
      deployer
    );
    expect(setWithdrawalAmount.result).toBeErr(
      Cl.uint(ErrCode.ERR_UNAUTHORIZED)
    );
  });
  ///////////////////////////////////////////
  // override-last-withdrawal-block() tests
  ///////////////////////////////////////////
  it("override-last-withdrawal-block() fails if called directly", () => {
    const overrideLastWithdrawalBlock = simnet.callPublicFn(
      contractAddress,
      "override-last-withdrawal-block",
      [Cl.uint(100)],
      deployer
    );
    expect(overrideLastWithdrawalBlock.result).toBeErr(
      Cl.uint(ErrCode.ERR_UNAUTHORIZED)
    );
  });
  ///////////////////////////////////////////
  // deposit() tests
  ///////////////////////////////////////////
  it("deposit() fails if amount is 0", () => {
    const depositSbtc = simnet.callPublicFn(
      contractAddress,
      "deposit",
      [Cl.uint(0)],
      deployer
    );
    expect(depositSbtc.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_AMOUNT));
  });
  it("deposit() succeeds and transfers sBTC to contract", () => {
    const depositSbtc = simnet.callPublicFn(
      contractAddress,
      "deposit",
      [Cl.uint(withdrawalAmount)],
      deployer
    );
    expect(depositSbtc.result).toBeOk(Cl.bool(true));
  });
  ///////////////////////////////////////////
  // withdraw() tests
  ///////////////////////////////////////////
  it("withdraw() fails if caller is not account holder", () => {
    const withdrawSbtc = simnet.callPublicFn(
      contractAddress,
      "withdraw",
      [],
      address2
    );
    expect(withdrawSbtc.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
});

describe(`read-only functions: ${ContractType.DAO_TIMED_VAULT_SBTC}`, () => {
  /////////////////////////////////////////////
  // get-account-balance() tests
  /////////////////////////////////////////////
  it("get-account-balance() returns the contract account balance", () => {
    // arrange
    const expectedResult = Cl.ok(Cl.uint(0));
    // act
    const getAccountBalance = simnet.callReadOnlyFn(
      contractAddress,
      "get-account-balance",
      [],
      deployer
    ).result;
    // assert
    expect(getAccountBalance).toStrictEqual(expectedResult);
    
    // Note: We can't actually test with real sBTC deposits in this test environment
    // This would require mocking the sBTC token contract
  });

  /////////////////////////////////////////////
  // get-account-terms() tests
  /////////////////////////////////////////////
  it("get-account-terms() returns the contract account terms", () => {
    // arrange
    const sbtcContract = 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token';
    const expectedResult = Cl.tuple({
      accountHolder: Cl.principal(contractAddress),
      contractName: Cl.principal(contractAddress),
      deployedBurnBlock: Cl.uint(5),
      deployedStacksBlock: Cl.uint(6),
      lastWithdrawalBlock: Cl.uint(0),
      vaultToken: Cl.principal(sbtcContract),
      withdrawalAmount: Cl.uint(withdrawalAmount),
      withdrawalPeriod: Cl.uint(withdrawalPeriod),
    });
    // act
    const getAccountTerms = simnet.callReadOnlyFn(
      contractAddress,
      "get-account-terms",
      [],
      deployer
    ).result;
    // assert
    expect(getAccountTerms).toStrictEqual(expectedResult);
  });
});
