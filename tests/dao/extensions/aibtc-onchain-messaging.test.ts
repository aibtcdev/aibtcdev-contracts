import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  constructDao,
  getDaoTokens,
  passCoreProposal,
} from "../../test-utilities";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

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
    const getDaoTokensReceipts = [
      getDaoTokens(deployer, deployer, 1000000000), // 1000 STX
      getDaoTokens(deployer, address1, 500000000), // 500 STX
      getDaoTokens(deployer, address2, 250000000), // 250 STX
    ];

    console.log("===========================");
    console.log("getDaoTokensReceipts");
    for (const receipt of getDaoTokensReceipts) {
      console.log(receipt);
    }

    // construct DAO
    const constructReceipt = constructDao(deployer);

    console.log("===========================");
    console.log("constructReceipt");
    console.log(constructReceipt);

    simnet.mineEmptyBlocks(10);

    // pass proposal
    const proposalReceipt = passCoreProposal(proposalContractAddress, deployer);

    console.log("===========================");
    console.log("proposalReceipt");
    console.log(proposalReceipt);

    const proposalDetails = simnet.callReadOnlyFn(
      `${deployer}.aibtc-core-proposals`,
      "get-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );

    console.log("===========================");
    console.log("proposalDetails");
    console.log(cvToValue(proposalDetails.result).value);

    simnet.mineEmptyBlocks(100);

    const votingPowerReceipt = simnet.callReadOnlyFn(
      `${deployer}.aibtc-core-proposals`,
      "get-voting-power",
      [Cl.principal(deployer), Cl.principal(proposalContractAddress)],
      deployer
    );

    console.log("===========================");
    console.log("votingPowerReceipt");
    console.log(cvToValue(votingPowerReceipt.result));

    const addressBalanceReceipt = simnet.callReadOnlyFn(
      `${deployer}.aibtc-token`,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    );

    console.log("===========================");
    console.log("addressBalanceReceipt");
    console.log(cvToValue(addressBalanceReceipt.result));

    const voteReceipt = simnet.callPublicFn(
      `${deployer}.aibtc-core-proposals`,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      deployer
    );

    console.log("===========================");
    console.log("voteReceipt");
    console.log(voteReceipt);

    expect(voteReceipt.result).toBeOk(Cl.bool(true));
  });
});
