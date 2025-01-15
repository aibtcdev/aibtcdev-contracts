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

    // fund accounts for creating and voting on proposals
    const getDaoTokensReceipts = [
      getDaoTokens(deployer, deployer, 1000000000), // 1000 STX
      getDaoTokens(deployer, address1, 500000000), // 500 STX
      getDaoTokens(deployer, address2, 250000000), // 250 STX
    ];
    const getAddressBalances = [
      simnet.callReadOnlyFn(
        `${deployer}.aibtc-token`,
        "get-balance",
        [Cl.principal(deployer)],
        deployer
      ),
      simnet.callReadOnlyFn(
        `${deployer}.aibtc-token`,
        "get-balance",
        [Cl.principal(address1)],
        deployer
      ),
      simnet.callReadOnlyFn(
        `${deployer}.aibtc-token`,
        "get-balance",
        [Cl.principal(address2)],
        deployer
      ),
    ];
    for (let i = 0; i < getDaoTokensReceipts.length; i++) {
      const expectedBalance = parseInt(
        cvToValue(getAddressBalances[i].result).value
      );
      console.log(`expectedBalance: ${expectedBalance}`);
      expect(getDaoTokensReceipts[i].result).toBeOk(Cl.uint(expectedBalance));
    }

    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);

    // pass proposal
    const concludeProposalReceipt = passCoreProposal(
      proposalContractAddress,
      deployer,
      [deployer, address1, address2]
    );

    console.log("===========================");
    console.log("concludeProposalReceipt");
    console.log(concludeProposalReceipt);
    for (const event of concludeProposalReceipt.events) {
      const eventValue = cvToValue(event.data.value!);
      // if event value is an object stringify it
      console.log(
        `- event: ${
          typeof eventValue === "object"
            ? JSON.stringify(eventValue)
            : eventValue
        }`
      );
    }

    const proposalDetails = simnet.callReadOnlyFn(
      `${deployer}.aibtc-core-proposals`,
      "get-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );

    console.log("===========================");
    console.log("proposalDetails");
    console.log(cvToValue(proposalDetails.result).value);

    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
  });
});
