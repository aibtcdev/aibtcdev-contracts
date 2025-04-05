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

const contractAddress = `${deployer}.${ContractActionType.DAO_ACTION_PMT_STX_ADD_RESOURCE}`;

describe(`action extension: ${ContractActionType.DAO_ACTION_PMT_STX_ADD_RESOURCE}`, () => {
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
    const resourceInfo = {
      name: Cl.stringUtf8("test"),
      description: Cl.stringUtf8("test description"),
      price: Cl.uint(1),
      url: Cl.some(Cl.stringUtf8("https://aibtc.dev")),
    };
    const receipt = simnet.callPublicFn(
      contractAddress,
      "run",
      [Cl.buffer(Cl.serialize(Cl.tuple(resourceInfo)))],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ActionErrCode.ERR_UNAUTHORIZED));
  });

  it("run() succeeds if called as a DAO action proposal", () => {
    const resourceInfo = {
      name: Cl.stringUtf8("test"),
      description: Cl.stringUtf8("test description"),
      price: Cl.uint(1),
      url: Cl.some(Cl.stringUtf8("https://aibtc.dev")),
    };
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
      Cl.tuple(resourceInfo),
      deployer,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );

    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
  });
});
