import {
  Cl,
  ClarityType,
  cvToValue,
  ResponseOkCV,
  SomeCV,
} from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ActionProposalsV2ErrCode } from "../../error-codes";
import {
  ActionProposalsV2ProposalData,
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

// general account definitions
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
// helper for contract name definitions
const getContract = (
  contractType: ContractType | ContractProposalType | ContractActionType
): string => `${deployer}.${contractType}`;
// general contract name definitons
const actionProposalsV2ContractAddress = getContract(
  ContractType.DAO_ACTION_PROPOSALS_V2
);
const actionProposalContractAddress = getContract(
  ContractActionType.DAO_ACTION_SEND_MESSAGE
);
const tokenContractAddress = getContract(ContractType.DAO_TOKEN);
const tokenDexContractAddress = getContract(ContractType.DAO_TOKEN_DEX);
const baseDaoContractAddress = getContract(ContractType.DAO_BASE);
const bootstrapContractAddress = getContract(
  ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
);
const coreProposalsV2ContractAddress = getContract(
  ContractType.DAO_CORE_PROPOSALS_V2
);
// general vote settings configurations
const actionProposalV2VoteSettings =
  VOTING_CONFIG[ContractType.DAO_ACTION_PROPOSALS_V2];
const coreProposalV2VoteSettings =
  VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
// import contract error codes
const ErrCode = ActionProposalsV2ErrCode;

describe(`public functions: ${ContractType.DAO_ACTION_PROPOSALS_V2}`, () => {
  ////////////////////////////////////////
  // callback() tests
  ////////////////////////////////////////

  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // propose-action() tests
  ////////////////////////////////////////

  it("propose-action() fails if the liquid tokens are 0", () => {
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_FETCHING_TOKEN_DATA));
  });

  it("propose-action() fails if the target action extension is disabled", () => {
    const disableExtensionContractAddress = `${deployer}.test-disable-action-proposals-v2`;
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
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));
    // call propose action
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });

  it("propose-action() fails if the action proposal extension itself is disabled", () => {
    const disableExtensionContractAddress = `${deployer}.test-disable-onchain-messaging-action`;
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
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));
    // call propose action
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });

  it("propose-action() fails if the action proposal is not a dao extension", () => {
    const disableExtensionContractAddress = `${deployer}.test-disable-onchain-messaging-action`;
    const actionProposalContractAddress = `${deployer}.test-unknown-action-proposal`;
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
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));
    // call propose action
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });

  it("propose-action() fails if the user does not own the dao token", () => {
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
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // call propose action from another wallet
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      address1
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });

  it("propose-action() fails if more than one proposal is created in a stacks block", () => {
    const actionProposalContractAddress2 = `${deployer}.${ContractActionType.DAO_ACTION_ADD_RESOURCE}`;
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
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // create proposal again in the same block
    const actionProposalReceipt2 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [
        Cl.principal(actionProposalContractAddress2),
        Cl.bufferFromAscii("test"),
      ],
      deployer
    );
    expect(actionProposalReceipt2.result).toBeErr(
      Cl.uint(ErrCode.ERR_ALREADY_PROPOSAL_AT_BLOCK)
    );
  });

  ////////////////////////////////////////
  // vote-on-proposal() tests
  ////////////////////////////////////////

  it("vote-on-proposal() fails if proposal id is not found", () => {
    const invalidProposalId = 25;
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(invalidProposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("vote-on-proposal() fails if the user does not own the token", () => {
    const proposalId = 1;
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
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingPeriod);
    // vote on proposal from another wallet
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      address1
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });

  it("vote-on-proposal() fails if the vote happens before proposal start block", () => {
    const proposalId = 1;
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
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // vote on proposal
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_SOON));
  });

  it("vote-on-proposal() fails if vote happens after proposal end block", () => {
    const proposalId = 1;
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
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay and voting period
    simnet.mineEmptyBlocks(
      actionProposalV2VoteSettings.votingDelay +
        actionProposalV2VoteSettings.votingPeriod
    );
    // vote on proposal
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_LATE));
  });

  it("vote-on-proposal() fails if user votes more than once on a proposal", () => {
    const proposalId = 1;
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
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // vote on proposal
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
    // attempt to vote again
    const receipt2 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_ALREADY_VOTED));
  });

  ////////////////////////////////////////
  // conclude-proposal() tests
  ////////////////////////////////////////

  it("conclude-proposal() fails if proposal id is not found", () => {
    const invalidProposalId = 25;
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(invalidProposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("conclude-proposal() fails if the proposal is already concluded", () => {
    const proposalId = 1;
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
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay, voting period and execution delay
    simnet.mineEmptyBlocks(
      actionProposalV2VoteSettings.votingDelay +
        actionProposalV2VoteSettings.votingPeriod +
        actionProposalV2VoteSettings.votingDelay
    );
    // conclude proposal, false with no votes
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(proposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(false));
    // attempt to conclude again
    const receipt2 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(proposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt2.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
    );
  });

  it("conclude-proposal() fails if the proposal is not past the voting window", () => {
    const proposalId = 1;
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
    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // conclude proposal after
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(proposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_VOTING_ACTIVE));
    // progress to start block of voting period
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // conclude proposal before voting period
    const receipt2 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(proposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt2.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_VOTING_ACTIVE)
    );
    // progress past voting period, still in execution delay
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingPeriod);
    // conclude proposal before voting period
    const receipt3 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(proposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt3.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_EXECUTION_DELAY)
    );
  });

  it("conclude-proposal() fails if the action does not match the stored action", () => {
    const actionProposalContractAddress2 = `${deployer}.${ContractActionType.DAO_ACTION_ADD_RESOURCE}`;
    const proposalId = 1;
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
    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay, voting period, execution delay
    simnet.mineEmptyBlocks(
      actionProposalV2VoteSettings.votingDelay +
        actionProposalV2VoteSettings.votingPeriod +
        actionProposalV2VoteSettings.votingDelay
    );
    // conclude proposal
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(proposalId), Cl.principal(actionProposalContractAddress2)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });

  it("conclude-proposal() succeeds and does not execute if the action proposal extension is disabled", () => {
    const disableExtensionContractAddress = `${deployer}.test-disable-onchain-messaging-action`;
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
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // disable the action extension
    const disableReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      disableExtensionContractAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(disableReceipt.result).toBeOk(Cl.bool(true));
    // conclude proposal
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(1), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(false));
    // verify proposal was not executed
    const proposalInfo = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-proposal",
      [Cl.uint(1)],
      deployer
    ).result as SomeCV;
    const proposalData = proposalInfo.value as ActionProposalsV2ProposalData;
    expect(proposalData.data.executed).toStrictEqual(Cl.bool(false));
  });
});

describe(`read-only functions: ${ContractType.DAO_ACTION_PROPOSALS_V2}`, () => {
  ////////////////////////////////////////
  // get-voting-power() tests
  ////////////////////////////////////////

  it("get-voting-power() fails if proposal is not found", () => {
    const invalidProposalId = 25;
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-voting-power",
      [Cl.principal(deployer), Cl.uint(invalidProposalId)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("get-voting-power() succeeds and returns token balance at block height", () => {
    const proposalId = 1;
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    // get voting power
    const votingPower = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    ).result;
    console.log(
      `get balance / expected voting power: ${JSON.stringify(
        votingPower,
        null,
        2
      )}`
    );
    // construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain for at-block calls
    console.log(`block height: ${simnet.mineEmptyBlocks(100)}`);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // get voting power
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-voting-power",
      [Cl.principal(deployer), Cl.uint(proposalId)],
      deployer
    );
    expect(receipt.result).toStrictEqual(votingPower);
  });

  ////////////////////////////////////////
  // get-proposal() tests
  ////////////////////////////////////////

  it("get-proposal() returns none if proposal is not found", () => {
    const invalidProposalId = 25;
    const expectedResult = Cl.none();
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-proposal",
      [Cl.uint(invalidProposalId)],
      deployer
    );
    expect(receipt.result).toStrictEqual(expectedResult);
  });

  it("get-proposal() succeeds and returns stored proposal data", () => {
    const actionProposalData = Cl.bufferFromAscii("test");
    const proposalId = 1;
    // expected proposal data
    const expectedResult = Cl.some(
      Cl.tuple({
        action: Cl.principal(actionProposalContractAddress),
        caller: Cl.principal(deployer),
        concluded: Cl.bool(false),
        createdAt: Cl.uint(14),
        creator: Cl.principal(deployer),
        endBlock: Cl.uint(446),
        executed: Cl.bool(false),
        liquidTokens: Cl.uint(33809918),
        metQuorum: Cl.bool(false),
        metThreshold: Cl.bool(false),
        parameters: Cl.bufferFromHex("0x74657374"),
        passed: Cl.bool(false),
        startBlock: Cl.uint(158),
        votesAgainst: Cl.uint(0),
        votesFor: Cl.uint(0),
      })
    );
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
    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), actionProposalData],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // get proposal
    const proposalInfo = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-proposal",
      [Cl.uint(proposalId)],
      deployer
    ).result;
    expect(proposalInfo).toStrictEqual(expectedResult);
  });

  ////////////////////////////////////////
  // get-vote-record() tests
  ////////////////////////////////////////

  it("get-vote-record() succeeds and returns 0 if voter is not found", () => {
    const invalidProposalId = 25;
    const expectedResult = Cl.uint(0);
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-vote-record",
      [Cl.uint(invalidProposalId), Cl.principal(address1)],
      deployer
    );
    expect(receipt.result).toStrictEqual(expectedResult);
  });

  it("get-vote-record() succeeds and returns vote amount for user and proposal", () => {
    const actionProposalData = Cl.bufferFromAscii("test");
    const proposalId = 1;
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    // get dao tokens for address1, increases liquid tokens
    const daoTokensReceipt2 = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      address1,
      2000
    );
    expect(daoTokensReceipt2.result).toBeOk(Cl.bool(true));
    // construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), actionProposalData],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // get balance for deployer
    const deployerBalance = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    ).result as ResponseOkCV;
    // get balance for address1
    const address1Balance = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result as ResponseOkCV;
    // progress past voting delay for at-block calls
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // vote on proposal
    const voteReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
    // vote on proposal for address1
    const voteReceipt2 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      address1
    );
    expect(voteReceipt2.result).toBeOk(Cl.bool(true));
    // get vote record
    const voteRecord = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-vote-record",
      [Cl.uint(proposalId), Cl.principal(deployer)],
      deployer
    ).result;
    expect(voteRecord).toStrictEqual(deployerBalance.value);
    // get vote record for address1
    const voteRecord2 = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-vote-record",
      [Cl.uint(proposalId), Cl.principal(address1)],
      deployer
    ).result;
    expect(voteRecord2).toStrictEqual(address1Balance.value);
  });

  ////////////////////////////////////////
  // get-total-proposals() tests
  ////////////////////////////////////////

  it("get-total-proposals() returns 0 if no proposals exist", () => {
    const expectedResult = Cl.uint(0);
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt.result).toStrictEqual(expectedResult);
  });

  it("get-total-proposals() returns total number of proposals", () => {
    const actionProposalData = Cl.bufferFromAscii("test");
    let totalProposals = 0;
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
    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), actionProposalData],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    totalProposals++;
    // get total proposals
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt.result).toStrictEqual(Cl.uint(totalProposals));
    // progress the chain
    simnet.mineEmptyBlock();
    // create 2nd proposal
    const actionProposalReceipt2 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), actionProposalData],
      deployer
    );
    expect(actionProposalReceipt2.result).toBeOk(Cl.bool(true));
    totalProposals++;
    // get total proposals
    const receipt2 = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt2.result).toStrictEqual(Cl.uint(totalProposals));
    // create 10 proposals
    for (let i = 0; i < 10; i++) {
      simnet.mineEmptyBlock();
      const actionProposalReceipt = simnet.callPublicFn(
        actionProposalsV2ContractAddress,
        "propose-action",
        [Cl.principal(actionProposalContractAddress), actionProposalData],
        deployer
      );
      expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
      totalProposals++;
    }
    // get total proposals
    const receipt3 = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt3.result).toStrictEqual(Cl.uint(totalProposals));
  });

  ////////////////////////////////////////
  // get-last-proposal-created() tests
  ////////////////////////////////////////

  it("get-last-proposal-created() succeeds and returns 0 if no proposals have been created", () => {
    const expectedResult = Cl.uint(0);
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-last-proposal-created",
      [],
      deployer
    );
    expect(receipt.result).toStrictEqual(expectedResult);
  });

  it("get-last-proposal-created() succeeds and returns the block height of the last proposal", () => {
    console.log(
      "test: get-last-proposal-created() succeeds and returns the block height of the last proposal"
    );
    const actionProposalData = Cl.bufferFromAscii("test");
    // variables to track block heights throughout the test
    const blockHeights: {
      blockHeights: number[];
      burnBlockHeights: number[];
      stacksBlockHeights: number[];
    } = {
      blockHeights: [],
      burnBlockHeights: [],
      stacksBlockHeights: [],
    };
    // helper function for block height output
    const logBlockHeights = () => {
      // log current block heights
      const blockHeight = simnet.blockHeight;
      const burnBlockHeight = simnet.burnBlockHeight;
      const stacksBlockHeight = simnet.stacksBlockHeight;
      // update block heights object
      blockHeights.blockHeights.push(blockHeight);
      blockHeights.burnBlockHeights.push(burnBlockHeight);
      blockHeights.stacksBlockHeights.push(stacksBlockHeight);
      // log output
      console.log({
        blockHeight,
        burnBlockHeight,
        stacksBlockHeight,
      });
    };
    // helper function for calling read-only function
    // get-block-hash with a block height, result: some/none
    const getBlockHash = (blockHeight: number) => {
      const receipt = simnet.callReadOnlyFn(
        actionProposalsV2ContractAddress,
        "get-block-hash",
        [Cl.uint(blockHeight)],
        deployer
      );
      const result = cvToValue(receipt.result);
      console.log(
        `block hash at ${blockHeight}: ${result ? result.value : "none"}`
      );
    };
    // helper function for calling read-only function
    // get-liquid-supply with a block height, result: ok/err
    const getLiquidSupply = (blockHeight: number) => {
      const receipt = simnet.callReadOnlyFn(
        actionProposalsV2ContractAddress,
        "get-liquid-supply",
        [Cl.uint(blockHeight)],
        deployer
      );
      if (receipt.result.type === ClarityType.ResponseOk) {
        console.log(
          `liquid supply at ${blockHeight}:  ${cvToValue(receipt.result).value}`
        );
      } else if (receipt.result.type === ClarityType.ResponseErr) {
        console.log(
          `liquid supply at ${blockHeight}: error u${
            cvToValue(receipt.result).value
          }`
        );
      }
    };
    // log starting info
    console.log("\n-- starting the test:");
    logBlockHeights();
    // get dao tokens for deployer, increases liquid tokens
    console.log("\n-- getting dao tokens...");
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    console.log("after fetching dao tokens:");
    console.log(`tx result: ${cvToValue(daoTokensReceipt.result, true).value}`);
    logBlockHeights();
    // progress the chain for at-block calls
    // pushing this higher to make sure past blocks exist
    const blocks = 1000;
    console.log(`\n-- progressing ${blocks} blocks`);
    const progressOutput = simnet.mineEmptyBlocks(blocks);
    console.log(
      `returned from simnet.mineEmptyBlocks(blocks): ${progressOutput}`
    );
    console.log("after progressing blocks:");
    logBlockHeights();
    // construct the dao
    console.log("\n-- constructing the dao...");
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    console.log("after dao is constructed:");
    logBlockHeights();
    console.log(`\n-- progressing ${blocks} blocks`);
    const progressOutput2 = simnet.mineEmptyBlocks(blocks);
    console.log(
      `returned from simnet.mineEmptyBlocks(blocks): ${progressOutput2}`
    );
    console.log("after progressing blocks:");
    logBlockHeights();
    // verify get-block-hash at past block heights
    console.log("\n-- verifying get-block-hash at past block heights");
    for (let i = 0; i < blockHeights.blockHeights.length; i++) {
      const blockHeight = blockHeights.blockHeights[i];
      const burnBlockHeight = blockHeights.burnBlockHeights[i];
      const stacksBlockHeight = blockHeights.stacksBlockHeights[i];
      console.log(
        `\nblock heights: ${JSON.stringify({
          blockHeight,
          burnBlockHeight,
          stacksBlockHeight,
        })}`
      );
      // log block hash and supply
      getBlockHash(blockHeight);
      getLiquidSupply(blockHeight);
      getBlockHash(burnBlockHeight);
      getLiquidSupply(burnBlockHeight);
      getBlockHash(stacksBlockHeight);
      getLiquidSupply(stacksBlockHeight);
    }
    // for the last values in each array, test minus 1
    const lastBlockHeight =
      blockHeights.blockHeights[blockHeights.blockHeights.length - 1] - 1;
    const lastBurnBlockHeight =
      blockHeights.burnBlockHeights[blockHeights.burnBlockHeights.length - 1] -
      1;
    const lastStacksBlockHeight =
      blockHeights.stacksBlockHeights[
        blockHeights.stacksBlockHeights.length - 1
      ] - 1;
    console.log(
      `\none block before current: ${JSON.stringify({
        lastBlockHeight,
        lastBurnBlockHeight,
        lastStacksBlockHeight,
      })}`
    );
    getBlockHash(lastBlockHeight);
    getLiquidSupply(lastBlockHeight);
    getBlockHash(lastBurnBlockHeight);
    getLiquidSupply(lastBurnBlockHeight);
    getBlockHash(lastStacksBlockHeight);
    getLiquidSupply(lastStacksBlockHeight);

    // create proposal
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), actionProposalData],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    // extract createdAt
    const actionProposalReceiptEvent = actionProposalReceipt.events.find(
      (eventRecord) => eventRecord.event === "print_event"
    );
    expect(actionProposalReceiptEvent).toBeDefined();
    const actionProposalReceiptEventData =
      actionProposalReceiptEvent?.data.value;
    const actionProposalPrintEvent = cvToValue(actionProposalReceiptEventData!);
    const createdAt = parseInt(
      actionProposalPrintEvent.payload.value.createdAt.value
    );
    // get last proposal created
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-last-proposal-created",
      [],
      deployer
    );
    expect(receipt.result).toBeUint(createdAt);
    // progress the chain
    simnet.mineEmptyBlock();
    // create 2nd proposal
    const actionProposalReceipt2 = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), actionProposalData],
      deployer
    );
    expect(actionProposalReceipt2.result).toBeOk(Cl.bool(true));
    // extract createdAt
    const actionProposalReceiptEvent2 = actionProposalReceipt2.events.find(
      (eventRecord) => eventRecord.event === "print_event"
    );
    expect(actionProposalReceiptEvent2).toBeDefined();
    const actionProposalReceiptEventData2 =
      actionProposalReceiptEvent2?.data.value;
    const actionProposalPrintEvent2 = cvToValue(
      actionProposalReceiptEventData2!
    );
    const createdAt2 = parseInt(
      actionProposalPrintEvent2.payload.value.createdAt.value
    );
    // get last proposal created
    const receipt2 = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-last-proposal-created",
      [],
      deployer
    );
    expect(receipt2.result).toStrictEqual(Cl.uint(createdAt2));
    // create 10 proposals
    for (let i = 0; i < 10; i++) {
      // progress the chain
      simnet.mineEmptyBlock();
      const actionProposalReceipt = simnet.callPublicFn(
        actionProposalsV2ContractAddress,
        "propose-action",
        [Cl.principal(actionProposalContractAddress), actionProposalData],
        deployer
      );
      expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
      // extract createdAt
      const actionProposalReceiptEvent = actionProposalReceipt.events.find(
        (eventRecord) => eventRecord.event === "print_event"
      );
      expect(actionProposalReceiptEvent).toBeDefined();
      const actionProposalReceiptEventData =
        actionProposalReceiptEvent?.data.value;
      const actionProposalPrintEvent = cvToValue(
        actionProposalReceiptEventData!
      );
      const createdAt = parseInt(
        actionProposalPrintEvent.payload.value.createdAt.value
      );
      // get last proposal created
      const receipt = simnet.callReadOnlyFn(
        actionProposalsV2ContractAddress,
        "get-last-proposal-created",
        [],
        deployer
      );
      expect(receipt.result).toStrictEqual(Cl.uint(createdAt));
    }
  });

  ////////////////////////////////////////
  // get-voting-configuration() tests
  ////////////////////////////////////////

  it("get-voting-configuration() returns the voting configuration in the contract", () => {
    const tokenPoolContractAddress = `${deployer}.${ContractType.DAO_BITFLOW_POOL}`;
    const treasuryContractAddress = `${deployer}.${ContractType.DAO_TREASURY}`;
    const blockHeight = simnet.blockHeight;
    const expectedResult = Cl.tuple({
      self: Cl.principal(actionProposalsV2ContractAddress),
      deployedBurnBlock: Cl.uint(blockHeight - 2),
      deployedStacksBlock: Cl.uint(blockHeight - 2),
      delay: Cl.uint(actionProposalV2VoteSettings.votingDelay),
      period: Cl.uint(actionProposalV2VoteSettings.votingPeriod),
      quorum: Cl.uint(actionProposalV2VoteSettings.votingQuorum),
      threshold: Cl.uint(actionProposalV2VoteSettings.votingThreshold),
      tokenDex: Cl.principal(tokenDexContractAddress),
      tokenPool: Cl.principal(tokenPoolContractAddress),
      treasury: Cl.principal(treasuryContractAddress),
    });
    const votingConfiguration = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-voting-configuration",
      [],
      deployer
    ).result;
    expect(votingConfiguration).toStrictEqual(expectedResult);
  });

  ////////////////////////////////////////
  // get-liquid-supply() tests
  ////////////////////////////////////////

  it("get-liquid-supply() returns the total liquid supply of the dao token", () => {
    let liquidSupply = 0;
    let blockHeight = simnet.blockHeight;
    // progress chain by 1 for at-block call
    simnet.mineEmptyBlock();
    // get liquid supply
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-liquid-supply",
      [Cl.uint(blockHeight)],
      deployer
    ).result;
    expect(receipt).toBeOk(Cl.uint(liquidSupply));
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    // progress chain by 1 for at-block call
    simnet.mineEmptyBlock();
    // get deployer balance
    const deployerBalanceResult = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    ).result as ResponseOkCV;
    liquidSupply += Number(cvToValue(deployerBalanceResult.value) as BigInt);
    // find the correct block height
    blockHeight = simnet.blockHeight - 1;
    // get liquid supply
    const receipt2 = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-liquid-supply",
      [Cl.uint(blockHeight)],
      deployer
    ).result;
    expect(receipt2).toBeOk(Cl.uint(liquidSupply));
  });
});
