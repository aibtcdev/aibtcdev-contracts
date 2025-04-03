import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { TimedVaultErrCode } from "../../error-codes";
import { ContractType } from "../../dao-types";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.${ContractType.DAO_TIMED_VAULT_DAO}`;

const ErrCode = TimedVaultErrCode;

const withdrawalAmount = 10000000; // 10 aibtc tokens
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
  // deposit-dao() tests
  ///////////////////////////////////////////
  it("deposit-dao() fails if amount is 0", () => {
    const depositDao = simnet.callPublicFn(
      contractAddress,
      "deposit-dao",
      [Cl.uint(0)],
      deployer
    );
    expect(depositDao.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_AMOUNT));
  });
  it("deposit-dao() succeeds and transfers DAO tokens to contract", () => {
    const depositDao = simnet.callPublicFn(
      contractAddress,
      "deposit-dao",
      [Cl.uint(withdrawalAmount)],
      deployer
    );
    expect(depositDao.result).toBeOk(Cl.bool(true));
  });
  ///////////////////////////////////////////
  // withdraw-dao() tests
  ///////////////////////////////////////////
  it("withdraw-dao() fails if caller is not account holder", () => {
    const withdrawDao = simnet.callPublicFn(
      contractAddress,
      "withdraw-dao",
      [],
      address2
    );
    expect(withdrawDao.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
});
