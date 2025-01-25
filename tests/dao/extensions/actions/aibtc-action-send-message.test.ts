import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  constructDao,
  fundVoters,
  getDaoTokens,
  passActionProposal,
} from "../../../test-utilities";
import { ActionErrCode } from "../../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractName = "aibtc-action-send-message";
const contractAddress = `${deployer}.${contractName}`;

describe(`action extension: ${contractName}`, () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  it("run() fails if called directly", () => {
    const message = "hello world";
    const receipt = simnet.callPublicFn(
      contractAddress,
      "run",
      [Cl.buffer(Cl.serialize(Cl.stringAscii(message)))],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ActionErrCode.ERR_UNAUTHORIZED));
  });

  it("run() succeeds if called as a DAO action proposal", () => {
    const message = "hello world";
    // fund accounts for creating and voting on proposals
    fundVoters(deployer, [deployer, address1, address2]);

    // construct DAO
    const constructReceipt = constructDao(deployer, false);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);

    // pass action proposal
    const concludeProposalReceipt = passActionProposal(
      contractAddress,
      Cl.stringAscii(message),
      deployer,
      deployer,
      [deployer, address1, address2]
    );

    /*
    console.log("===========================");
    console.log("concludeProposalReceipt");
    console.log(concludeProposalReceipt);
    console.log("events:");
    for (const event of concludeProposalReceipt.events) {
      const eventValue = cvToValue(event.data.value!);
      // if event value is an object stringify it
      console.log(
        `${
          typeof eventValue === "object"
            ? JSON.stringify(eventValue)
            : eventValue
        }`
      );
    }

    const proposalDetails = simnet.callReadOnlyFn(
      `${deployer}.aibtc-action-proposals`,
      "get-proposal",
      [Cl.uint(1)],
      deployer
    );

    console.log("===========================");
    console.log("proposalDetails");
    console.log(cvToValue(proposalDetails.result).value);
    */

    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
  });
});
