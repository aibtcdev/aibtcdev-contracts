import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  constructDao,
  fundVoters,
  passCoreProposal,
  VOTING_CONFIG,
} from "../../test-utilities";
import { OnchainMessagingErrCode } from "../../error-codes";
import { ContractProposalType, ContractType } from "../../dao-types";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractAddress = `${deployer}.${ContractType.DAO_MESSAGING}`;
const ErrCode = OnchainMessagingErrCode;

describe(`extension: ${ContractType.DAO_MESSAGING}`, () => {
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
    // setup contract names
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const coreProposalsContractAddress = `${deployer}.${ContractType.DAO_CORE_PROPOSALS_V2}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;
    const proposalContractAddress = `${deployer}.${ContractProposalType.DAO_ONCHAIN_MESSAGING_SEND}`;

    // select voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

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

    // conclude proposal
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
  });
});
