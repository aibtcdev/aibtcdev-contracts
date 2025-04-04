import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { TimedVaultErrCode } from "../../error-codes";
import { ContractType } from "../../dao-types";
import { getDaoTokens } from "../../test-utilities";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.${ContractType.DAO_TIMED_VAULT_DAO}`;

const ErrCode = TimedVaultErrCode;

const withdrawalAmount = 100000000000; // 1,000 DAO tokens (8 decimals)
const withdrawalPeriod = 144; // 144 blocks

describe(`public functions: ${ContractType.DAO_TIMED_VAULT_DAO}`, () => {
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
    expect(setAccountHolder.result).toBeErr(
      Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION)
    );
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
      Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION)
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
      Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION)
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
      Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION)
    );
  });
  ///////////////////////////////////////////
  // deposit() tests
  ///////////////////////////////////////////
  it("deposit() fails if amount is 0", () => {
    const depositDao = simnet.callPublicFn(
      contractAddress,
      "deposit",
      [Cl.uint(0)],
      deployer
    );
    expect(depositDao.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_AMOUNT));
  });
  it("deposit() succeeds and transfers DAO tokens to contract", () => {
    // arrange
    const daoTokenContract = `${deployer}.${ContractType.DAO_TOKEN}`;
    const daoTokenDexContract = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const satsAmount = 400000; // 400,000 sats or 0.004 BTC
    const depositAmount = Cl.uint(withdrawalAmount);
    const faucetReceipt = getDaoTokens(
      daoTokenContract,
      daoTokenDexContract,
      deployer,
      satsAmount
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    const depositDaoReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit",
      [depositAmount],
      deployer
    );
    expect(depositDaoReceipt.result).toBeOk(Cl.bool(true));
    const depositDao = simnet.callPublicFn(
      contractAddress,
      "deposit",
      [Cl.uint(withdrawalAmount)],
      deployer
    );
    expect(depositDao.result).toBeOk(Cl.bool(true));
  });
  ///////////////////////////////////////////
  // withdraw() tests
  ///////////////////////////////////////////
  it("withdraw() fails if caller is not account holder", () => {
    const withdrawDao = simnet.callPublicFn(
      contractAddress,
      "withdraw",
      [],
      address2
    );
    expect(withdrawDao.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_ACCOUNT_HOLDER));
  });
});

describe(`read-only functions: ${ContractType.DAO_TIMED_VAULT_DAO}`, () => {
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
    // arrange
    const daoTokenContract = `${deployer}.${ContractType.DAO_TOKEN}`;
    const daoTokenDexContract = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const satsAmount = 400000; // 400,000 sats or 0.004 BTC
    const depositAmount = Cl.uint(10000000000); // 100 dao token, 8 decimals
    const faucetReceipt = getDaoTokens(
      daoTokenContract,
      daoTokenDexContract,
      deployer,
      satsAmount
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    const depositDaoReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit",
      [depositAmount],
      deployer
    );
    expect(depositDaoReceipt.result).toBeOk(Cl.bool(true));
    const expectedResult2 = Cl.ok(depositAmount);
    // act
    const getAccountBalance2 = simnet.callReadOnlyFn(
      contractAddress,
      "get-account-balance",
      [],
      deployer
    ).result;
    // assert
    expect(getAccountBalance2).toStrictEqual(expectedResult2);
  });

  /////////////////////////////////////////////
  // get-account-terms() tests
  /////////////////////////////////////////////
  it("get-account-terms() returns the contract account terms", () => {
    // arrange
    const daoTokenContract = `${deployer}.${ContractType.DAO_TOKEN}`;
    const expectedResult = Cl.tuple({
      accountHolder: Cl.principal(contractAddress),
      contractName: Cl.principal(contractAddress),
      deployedBurnBlock: Cl.uint(5),
      deployedStacksBlock: Cl.uint(6),
      lastWithdrawalBlock: Cl.uint(0),
      vaultToken: Cl.principal(daoTokenContract),
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
