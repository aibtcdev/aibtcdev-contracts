import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../../dao-types";
import { ActionErrCode } from "../../../error-codes";
import {
  constructDao,
  fundVoters,
  passActionProposal,
  VOTING_CONFIG,
} from "../../../test-utilities";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

const contractAddress = `${deployer}.${ContractActionType.DAO_ACTION_CONFIGURE_TIMED_VAULT}`;

describe(`action extension: ${ContractActionType.DAO_ACTION_CONFIGURE_TIMED_VAULT}`, () => {
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
    const accountHolder = Cl.some(Cl.principal(address3));
    const withdrawalAmount = Cl.some(Cl.uint(1000));
    const withdrawalPeriod = Cl.some(Cl.uint(100));
    const paramsCV = Cl.tuple({
      accountHolder,
      amount: withdrawalAmount,
      period: withdrawalPeriod,
    });
    const receipt = simnet.callPublicFn(
      contractAddress,
      "run",
      [Cl.buffer(Cl.serialize(paramsCV))],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ActionErrCode.ERR_UNAUTHORIZED));
  });

  it("run() fails if called as a DAO action proposal with all three opt params as none", () => {
    const accountHolder = Cl.none();
    const withdrawalAmount = Cl.none();
    const withdrawalPeriod = Cl.none();
    const paramsCV = Cl.tuple({
      accountHolder,
      amount: withdrawalAmount,
      period: withdrawalPeriod,
    });
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
      paramsCV,
      deployer,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );

    // false indicates proposal did not run
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(false));
  });

  it("run() succeeds if called as a DAO action proposal", () => {
    const accountHolder = Cl.some(Cl.principal(address3));
    const withdrawalAmount = Cl.some(Cl.uint(1000));
    const withdrawalPeriod = Cl.some(Cl.uint(100));
    const paramsCV = Cl.tuple({
      accountHolder,
      amount: withdrawalAmount,
      period: withdrawalPeriod,
    });
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
      paramsCV,
      deployer,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );

    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
  });
});
