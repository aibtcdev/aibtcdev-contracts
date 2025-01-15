import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  constructDao,
  getDaoTokens,
  passCoreProposal,
} from "../../test-utilities";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-onchain-messaging";
const contractAddress = `${deployer}.${contractName}`;

export enum ErrCode {
  INPUT_ERROR = 4000,
  ERR_UNAUTHORIZED,
}

describe(`extension: ${contractName}`, () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  it("send() succeeds if called by any user with isFromDao false", () => {
    const message = "test";
    const receipt = simnet.callPublicFn(
      contractAddress,
      "send",
      [Cl.stringAscii(message), Cl.bool(false)],
      address1
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("send() fails if called by any user with isFromDao true", () => {
    const message = "test";
    const receipt = simnet.callPublicFn(
      contractAddress,
      "send",
      [Cl.stringAscii(message), Cl.bool(true)],
      address1
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("send() succeeds if called by a DAO proposal with isFromDao true", () => {
    const proposalContractName = "aibtc-onchain-messaging-send";
    const proposalContractAddress = `${deployer}.${proposalContractName}`;
    const message = "test";

    // fund account that sends proposal
    const getDaoTokensReceipt = getDaoTokens(deployer, deployer);

    console.log("getDaoTokensReceipt");
    console.log(getDaoTokensReceipt);

    // construct DAO
    const constructReceipt = constructDao(deployer);

    console.log("constructReceipt");
    console.log(constructReceipt);

    // pass proposal
    const proposalReceipt = passCoreProposal(proposalContractAddress, deployer);

    console.log("proposalReceipt");
    console.log(proposalReceipt);

    const proposalDetails = simnet.callReadOnlyFn(
      `${deployer}.aibtc-core-proposals`,
      "get-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );

    console.log("proposalDetails");
    console.log(cvToValue(proposalDetails.result));

    simnet.mineEmptyBlocks(100);

    const votingPowerReceipt = simnet.callReadOnlyFn(
      `${deployer}.aibtc-core-proposals`,
      "get-voting-power",
      [Cl.principal(deployer), Cl.principal(proposalContractAddress)],
      deployer
    );

    console.log("votingPowerReceipt");
    console.log(cvToValue(votingPowerReceipt.result));

    const addressBalanceReceipt = simnet.callReadOnlyFn(
      `${deployer}.aibtc-token`,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    );

    console.log("addressBalanceReceipt");
    console.log(cvToValue(addressBalanceReceipt.result));

    const voteReceipt = simnet.callPublicFn(
      `${deployer}.aibtc-core-proposals`,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      deployer
    );

    console.log("voteReceipt");
    console.log(voteReceipt);

    expect(voteReceipt.result).toBeOk(Cl.bool(true));
  });

  /*
  // Message Tests
  describe("send()", () => {
    it("succeeds if called by any user with isFromDao false");
    it("fails if called by any user with isFromDao true");
    it("succeeds if called by a DAO proposal with isFromDao true");
  });
  */
});
