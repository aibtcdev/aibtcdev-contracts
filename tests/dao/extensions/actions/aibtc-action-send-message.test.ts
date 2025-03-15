import {
  Cl,
  ClarityType,
  ClarityValue,
  cvToValue,
  TupleCV,
} from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  constructDao,
  convertSIP019PrintEvent,
  dbgLog,
  fundVoters,
  passActionProposal,
  VOTING_CONFIG,
} from "../../../test-utilities";
import { ActionErrCode } from "../../../error-codes";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../../dao-types";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;

describe(`action extension: ${ContractActionType.DAO_ACTION_SEND_MESSAGE}`, () => {
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
    // setup contract names
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const actionProposalsContractAddress = `${deployer}.${ContractType.DAO_ACTION_PROPOSALS_V2}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;

    // setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_ACTION_PROPOSALS_V2];

    // fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // pass action proposal
    const concludeProposalReceipt = passActionProposal(
      actionProposalsContractAddress,
      contractAddress,
      1, // proposal ID
      Cl.stringAscii(message),
      deployer,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );

    //dbgLog("-- concludeProposalReceipt:");
    //dbgLog(JSON.stringify(concludeProposalReceipt, null, 2));
    const result = cvToValue(concludeProposalReceipt.result);
    dbgLog(`-- tx result: ${JSON.stringify(result)}`);

    for (const event of concludeProposalReceipt.events) {
      dbgLog(`-- tx event: ${event.event}`);

      if (event.data.value?.type === ClarityType.StringASCII) {
        dbgLog(`type: ${event.data.value.type} (StringASCII)`);
        dbgLog(`value: ${event.data.value.data}`);
      } else if (event.data.value?.type === ClarityType.Tuple) {
        dbgLog(`type: ${event.data.value.type} (Tuple)`);
        const printEvent = convertSIP019PrintEvent(event);
        dbgLog(`value: ${JSON.stringify(printEvent, null, 2)}`);
      } else {
        dbgLog(`type: ${event.data.value?.type} (unknown)`);
        dbgLog(`value: ${JSON.stringify(event.data.value, null, 2)}`);
      }
    }

    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
  });
});
