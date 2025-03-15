import { bufferCVFromString, Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { BaseDaoErrCode } from "../error-codes";
import { constructDao } from "../test-utilities";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-base-dao";
const contractAddress = `${deployer}.${contractName}`;
const coreProposalOnchainMessaging = `${deployer}.aibtc-onchain-messaging-send`;
const treasuryContractAddress = `${deployer}.aibtc-treasury`;
const bootstrapContractAddress = `${deployer}.aibtc-base-bootstrap-initialization-v2`;

const ErrCode = BaseDaoErrCode;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // construct() tests
  ////////////////////////////////////////
  it("construct() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "construct",
      [Cl.principal(coreProposalOnchainMessaging)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ////////////////////////////////////////
  // execute() tests
  ////////////////////////////////////////
  it("execute() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "execute",
      [Cl.principal(coreProposalOnchainMessaging), Cl.principal(address1)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ////////////////////////////////////////
  // set-extension() tests
  ////////////////////////////////////////
  it("set-extension() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-extension",
      [Cl.principal(coreProposalOnchainMessaging), Cl.bool(true)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ////////////////////////////////////////
  // set-extensions() tests
  ////////////////////////////////////////
  it("set-extensions() fails if called directly", () => {
    // arrange
    const extension = Cl.tuple({
      extension: Cl.principal(coreProposalOnchainMessaging),
      enabled: Cl.bool(true),
    });
    const extensionList = Cl.list([extension]);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-extensions",
      [extensionList],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ////////////////////////////////////////
  // request-extension-callback() tests
  ////////////////////////////////////////
  it("request-extension-callback() fails if called directly", () => {
    // arrange
    const memo = bufferCVFromString("0x");
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "request-extension-callback",
      [Cl.principal(treasuryContractAddress), memo],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_EXTENSION));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // is-constructed() tests
  ////////////////////////////////////////
  it("is-constructed() returns false before dao is constructed", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-constructed",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });
  it("is-constructed() returns true after dao is constructed", () => {
    // arrange
    const constructReceipt = constructDao(
      deployer,
      contractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-constructed",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(true));
  });
  ////////////////////////////////////////
  // is-extension() tests
  ////////////////////////////////////////
  it("is-extension() returns false before dao is constructed", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-extension",
      [Cl.principal(treasuryContractAddress)],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });
  ////////////////////////////////////////
  // executed-at() tests
  ////////////////////////////////////////
  it("executed-at() returns none if the proposal was not executed", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "executed-at",
      [Cl.principal(bootstrapContractAddress)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
});
