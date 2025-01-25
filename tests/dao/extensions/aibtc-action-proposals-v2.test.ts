import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ActionProposalsV2ErrCode } from "../../error-codes";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../dao-types";
import {
  constructDao,
  getDaoTokens,
  VOTING_CONFIG,
} from "../../test-utilities";
import { address } from "@stacks/transactions/dist/cl";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;

const contractAddress = `${deployer}.${ContractType.DAO_ACTION_PROPOSALS_V2}`;

const votingDelay = 144; // 144 Bitcoin blocks (~1 day)
const votingPeriod = 288; // 2 x 144 Bitcoin blocks (~2 days)
const votingQuorum = 15; // 15% of liquid supply must participate
const votingThreshold = 66; // 66% of votes must be in favor

const votingTokenDex = `${deployer}.aibtc-token-dex`;
const votingToken = `${deployer}.aibtc-token`;
const votingTreasury = `${deployer}.aibtc-treasury`;

const ErrCode = ActionProposalsV2ErrCode;

describe(`extension: ${ContractType.DAO_ACTION_PROPOSALS_V2}`, () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });
  it("propose-action() fails if the liquid tokens are 0", () => {
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const receipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_FETCHING_TOKEN_DATA));
  });
  it("propose-action() fails if the user does not own the token", () => {
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;

    const votingConfig = VOTING_CONFIG[ContractType.DAO_ACTION_PROPOSALS_V2];

    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));

    // construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(votingConfig.votingDelay);

    // call propose action from another wallet
    const receipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      address1
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });
});
