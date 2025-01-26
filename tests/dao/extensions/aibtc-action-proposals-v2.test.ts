import { Cl, cvToJSON, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ActionProposalsV2ErrCode } from "../../error-codes";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../dao-types";
import {
  constructDao,
  fundVoters,
  getDaoTokens,
  passCoreProposal,
  VOTING_CONFIG,
} from "../../test-utilities";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractAddress = `${deployer}.${ContractType.DAO_ACTION_PROPOSALS_V2}`;

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
  it("propose-action() fails if the action extension is disabled", () => {
    const coreProposalsContractAddress = `${deployer}.${ContractType.DAO_CORE_PROPOSALS_V2}`;
    const disableExtensionContractAddress = `${deployer}.test-disable-action-proposals-v2`;
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;

    // fund voters to pass proposals
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

    // progress past voting delay for at-block calls
    const coreProposalVoteSettings =
      VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
    simnet.mineEmptyBlocks(coreProposalVoteSettings.votingDelay);

    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalVoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));

    // call propose action
    const receipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });
  it("propose-action() fails if the action proposal extension is disabled", () => {
    const coreProposalsContractAddress = `${deployer}.${ContractType.DAO_CORE_PROPOSALS_V2}`;
    const disableExtensionContractAddress = `${deployer}.test-disable-onchain-messaging-action`;
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;

    // fund voters to pass proposals
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

    // progress past voting delay for at-block calls
    const coreProposalVoteSettings =
      VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
    simnet.mineEmptyBlocks(coreProposalVoteSettings.votingDelay);

    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalVoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));

    // call propose action
    const receipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });
  it("propose-action() fails if the action proposal is not a dao extension", () => {
    const coreProposalsContractAddress = `${deployer}.${ContractType.DAO_CORE_PROPOSALS_V2}`;
    const disableExtensionContractAddress = `${deployer}.test-disable-onchain-messaging-action`;
    const actionProposalContractAddress = `${deployer}.test-unknown-action-proposal`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;

    // fund voters to pass proposals
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

    // progress past voting delay for at-block calls
    const coreProposalVoteSettings =
      VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
    simnet.mineEmptyBlocks(coreProposalVoteSettings.votingDelay);

    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalVoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));

    // call propose action
    const receipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
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

  // it("vote-on-proposal()", () => {})
  it("vote-on-proposal(): fails if proposal id is not found", () => {
    const invalidProposalId = 25;
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.uint(invalidProposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });
  it("vote-on-proposal(): fails if the user does not own the token", () => {
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;
    const proposalId = 1;
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

    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(votingConfig.votingPeriod);

    // vote on proposal from another wallet
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      address1
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });
  it("vote-on-proposal(): fails if the vote happens before proposal start block", () => {
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;
    const proposalId = 1;
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

    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));

    // vote on proposal
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_SOON));
  });
  it("vote-on-proposal(): fails if vote happens after proposal end block", () => {
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;
    const proposalId = 1;
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

    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress past voting period
    simnet.mineEmptyBlocks(votingConfig.votingPeriod);

    // vote on proposal
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_LATE));
  });
  it("vote-on-proposal(): fails if user votes more than once on a proposal", () => {
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;
    const proposalId = 1;
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

    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress past voting delay
    simnet.mineEmptyBlocks(votingConfig.votingDelay);

    // vote on proposal
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));

    // attempt to vote again
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_ALREADY_VOTED));
  });

  // it("conclude-proposal()", () => {})
  it("conclude-proposal(): fails if proposal id is not found", () => {
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const invalidProposalId = 25;
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-proposal",
      [Cl.uint(invalidProposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });
  it("conclude-proposal(): fails if the action proposal extension is disabled", () => {
    const coreProposalsContractAddress = `${deployer}.${ContractType.DAO_CORE_PROPOSALS_V2}`;
    const disableExtensionContractAddress = `${deployer}.test-disable-onchain-messaging-action`;
    const actionProposalContractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SEND_MESSAGE}`;
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;

    // fund voters to pass proposals
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

    // progress past voting delay for at-block calls
    const coreProposalVoteSettings =
      VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
    simnet.mineEmptyBlocks(coreProposalVoteSettings.votingDelay);

    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(coreProposalVoteSettings.votingPeriod);

    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalVoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));

    // conclude proposal
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-proposal",
      [Cl.uint(1), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });
});
