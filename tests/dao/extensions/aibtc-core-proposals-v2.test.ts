import { Cl, cvToValue, ResponseOkCV, SomeCV, UIntCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { CoreProposalV2ErrCode } from "../../error-codes";
import {
  constructDao,
  failCoreProposal,
  fundVoters,
  getDaoTokens,
  passCoreProposal,
  VOTING_CONFIG,
} from "../../test-utilities";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../dao-types";

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
const coreProposalsV2ContractAddress = getContract(
  ContractType.DAO_CORE_PROPOSALS_V2
);
const coreProposalContactAddress = getContract(
  ContractProposalType.DAO_ONCHAIN_MESSAGING_SEND
);
const tokenContractAddress = getContract(ContractType.DAO_TOKEN);
const tokenDexContractAddress = getContract(ContractType.DAO_TOKEN_DEX);
const baseDaoContractAddress = getContract(ContractType.DAO_BASE);
const bootstrapContractAddress = getContract(
  ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
);
// general vote settings configurations
const coreProposalV2VoteSettings =
  VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
// import contract error codes
const ErrCode = CoreProposalV2ErrCode;

// helper for getting start block for proposals
const getProposalStartBlock = (burnBlockHeight: number): number => {
  return burnBlockHeight + coreProposalV2VoteSettings.votingDelay;
};

// helper for getting end block for proposals
const getProposalEndBlock = (startBlock: number): number => {
  return startBlock + coreProposalV2VoteSettings.votingPeriod;
};

// helper putting those two together
const getProposalBlocks = (burnBlockHeight: number) => {
  const startBlock = getProposalStartBlock(burnBlockHeight);
  const endBlock = getProposalEndBlock(startBlock);
  return { startBlock, endBlock };
};

describe(`public functions: ${ContractType.DAO_CORE_PROPOSALS_V2}`, () => {
  ////////////////////////////////////////
  // callback() tests
  ////////////////////////////////////////

  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // create-proposal() tests
  ////////////////////////////////////////

  it("create-proposal() fails if the liquid tokens are 0", () => {
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_FETCHING_TOKEN_DATA));
  });

  it("create-proposal() fails if sent during the first voting period", () => {
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
    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // create core proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_FIRST_VOTING_PERIOD));
  });

  it("create-proposal() fails if the user does not own the dao token", () => {
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
    // progress chain into voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay + 10);
    // create core proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      address1
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });

  it("create-proposal() fails if the proposal was already executed", () => {
    // fund voters to pass the proposal
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
    // pass core proposal
    const passProposalReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      coreProposalContactAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(passProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // create core proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_EXECUTED)
    );
  });

  ////////////////////////////////////////
  // vote-on-proposal() tests
  ////////////////////////////////////////

  it("vote-on-proposal() fails if proposal is not found", () => {
    const invalidProposal = getContract(
      ContractProposalType.DAO_TREASURY_ALLOW_ASSET
    );
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(invalidProposal), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("vote-on-proposal() fails if the user does not own the dao token", () => {
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
    // progress chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create core proposal
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // vote on proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      address1
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });

  it("vote-on-proposal() fails if the proposal is already concluded", () => {
    // fund voters to pass the proposal
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
    // pass core proposal
    const passProposalReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      coreProposalContactAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(passProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // vote on proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
    );
  });

  it("vote-on-proposal() fails if the vote happens before proposal start block", () => {
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
    // progress chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create core proposal
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // vote on proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_SOON));
  });

  it("vote-on-proposal() fails if the vote happens after proposal end block", () => {
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
    // progress chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create core proposal
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past the voting delay + voting period
    simnet.mineEmptyBlocks(
      coreProposalV2VoteSettings.votingDelay +
        coreProposalV2VoteSettings.votingPeriod
    );
    // vote on proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_LATE));
  });

  it("vote-on-proposal() fails if the user has already voted", () => {
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
    // progress chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create core proposal
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // vote on proposal
    const voteReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
    // vote on proposal again
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_ALREADY_VOTED));
  });

  ////////////////////////////////////////
  // conclude-proposal() tests
  ////////////////////////////////////////

  it("conclude-proposal() fails if proposal is not found", () => {
    const invalidProposal = getContract(
      ContractProposalType.DAO_TREASURY_ALLOW_ASSET
    );
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.principal(invalidProposal)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("conclude-proposal() fails if the proposal is already concluded", () => {
    // fund voters to pass the proposal
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
    // pass core proposal
    const passProposalReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      coreProposalContactAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(passProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // conclude proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
    );
  });

  it("conclude-proposal() fails if proposal voting is still active", () => {
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
    // progress chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create core proposal
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // conclude proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_VOTING_ACTIVE));
  });

  it("conclude-proposal() fails if called during the initial execution delay", () => {
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
    // progress chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create core proposal
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // vote on proposal
    const voteReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past the voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // conclude proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_EXECUTION_DELAY)
    );
  });

  it("conclude-proposal() succeeds and does not execute the proposal if vote does not pass", () => {
    // fund voters to fail the proposal
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
    // pass core proposal
    const passProposalReceipt = failCoreProposal(
      coreProposalsV2ContractAddress,
      coreProposalContactAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(passProposalReceipt.result).toBeOk(Cl.bool(false));
  });

  it("conclude-proposal() succeeds but does not execute if proposal is too old (expired)", () => {
    // fund voters to pass the proposal
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
    // progress chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create core proposal
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // vote on proposal
    const voteReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past the voting period and execution delay
    simnet.mineEmptyBlocks(
      coreProposalV2VoteSettings.votingPeriod + 
      coreProposalV2VoteSettings.votingDelay
    );
    // progress chain past the expiration period (voting period + voting delay)
    simnet.mineEmptyBlocks(
      coreProposalV2VoteSettings.votingPeriod + 
      coreProposalV2VoteSettings.votingDelay + 1
    );
    // conclude proposal
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(false));
    
    // verify proposal was concluded but not executed
    const proposalInfo = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    ).result as SomeCV;
    const proposalData = proposalInfo.value;
    expect(proposalData.data.concluded).toStrictEqual(Cl.bool(true));
    expect(proposalData.data.executed).toStrictEqual(Cl.bool(false));
  });
});

describe(`read-only functions: ${ContractType.DAO_CORE_PROPOSALS_V2}`, () => {
  ////////////////////////////////////////
  // get-voting-power() tests
  ////////////////////////////////////////

  it("get-voting-power() fails if proposal is not found", () => {
    const invalidProposal = getContract(
      ContractProposalType.DAO_TREASURY_ALLOW_ASSET
    );
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-voting-power",
      [Cl.principal(deployer), Cl.principal(invalidProposal)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("get-voting-power() succeeds and returns token balance at block height", () => {
    // fund voters to pass the proposal
    const fundVotersAmounts = fundVoters(
      tokenContractAddress,
      tokenDexContractAddress,
      [deployer, address1, address2]
    );
    // construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    // pass core proposal
    const passProposalReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      coreProposalContactAddress,
      deployer,
      [deployer, address1, address2],
      coreProposalV2VoteSettings
    );
    expect(passProposalReceipt.result).toBeOk(Cl.bool(true));
    // get voting power
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-voting-power",
      [Cl.principal(deployer), Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.uint(fundVotersAmounts.get(deployer)!));
    const receipt2 = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-voting-power",
      [Cl.principal(address1), Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt2.result).toBeOk(Cl.uint(fundVotersAmounts.get(address1)!));
    const receipt3 = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-voting-power",
      [Cl.principal(address2), Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt3.result).toBeOk(Cl.uint(fundVotersAmounts.get(address2)!));
  });

  ////////////////////////////////////////
  // get-proposal() tests
  ////////////////////////////////////////

  it("get-proposal() returns none if proposal is not found", () => {
    const invalidProposal = getContract(
      ContractProposalType.DAO_TREASURY_ALLOW_ASSET
    );
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-proposal",
      [Cl.principal(invalidProposal)],
      deployer
    );
    expect(receipt.result).toBeNone();
  });

  it("get-proposal() succeeds and returns stored proposal data", () => {
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    const daoTokensReceiptEvent = daoTokensReceipt.events.find(
      (eventRecord) => eventRecord.event === "ft_transfer_event"
    );
    expect(daoTokensReceiptEvent).toBeDefined();
    const daoTokensAmount = parseInt(daoTokensReceiptEvent!.data.amount);
    // construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);

    // create core proposal
    const createdAtStacksBlock = simnet.stacksBlockHeight;
    const createdAtBurnBlock = simnet.burnBlockHeight;
    const { startBlock, endBlock } = getProposalBlocks(createdAtBurnBlock);
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    const createProposalReceiptEvent = createProposalReceipt.events.find(
      (eventRecord) => eventRecord.event === "print_event"
    );
    expect(createProposalReceiptEvent).toBeDefined();
    const createProposalReceiptEventData =
      createProposalReceiptEvent!.data.value;
    const createProposalPrintEvent = cvToValue(createProposalReceiptEventData!);
    const createdAt = parseInt(
      createProposalPrintEvent.payload.value.createdAt.value
    );

    // get proposal info
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    // compare to expected result
    const expectedResult = Cl.some(
      Cl.tuple({
        createdAt: Cl.uint(createdAtStacksBlock), // createdAt
        caller: Cl.principal(deployer),
        creator: Cl.principal(deployer),
        startBlock: Cl.uint(startBlock), // createdAt + coreProposalV2VoteSettings.votingDelay
        endBlock: Cl.uint(endBlock), // createdAt + coreProposalV2VoteSettings.votingDelay + coreProposalV2VoteSettings.votingPeriod
        votesFor: Cl.uint(0),
        votesAgainst: Cl.uint(0),
        liquidTokens: Cl.uint(daoTokensAmount),
        concluded: Cl.bool(false),
        metQuorum: Cl.bool(false),
        metThreshold: Cl.bool(false),
        passed: Cl.bool(false),
        executed: Cl.bool(false),
      })
    );
    expect(receipt.result).toStrictEqual(expectedResult);
  });

  ////////////////////////////////////////
  // get-vote-record() tests
  ////////////////////////////////////////

  it("get-vote-record() succeeds and returns 0 if voter is not found", () => {
    const invalidProposal = getContract(
      ContractProposalType.DAO_TREASURY_ALLOW_ASSET
    );
    const expectedResult = 0;
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-vote-record",
      [Cl.principal(invalidProposal), Cl.principal(deployer)],
      deployer
    );
    expect(receipt.result).toBeUint(expectedResult);
  });

  it("get-vote-record() succeeds and returns vote amount for user and proposal", () => {
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
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create proposal
    const coreProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(coreProposalReceipt.result).toBeOk(Cl.bool(true));
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
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingDelay);
    // vote on proposal
    const voteReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
    // vote on proposal for address1
    const voteReceipt2 = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.principal(coreProposalContactAddress), Cl.bool(true)],
      address1
    );
    expect(voteReceipt2.result).toBeOk(Cl.bool(true));
    // get vote record
    const voteRecord = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-vote-record",
      [Cl.principal(coreProposalContactAddress), Cl.principal(deployer)],
      deployer
    ).result;
    expect(voteRecord).toStrictEqual(deployerBalance.value);
    // get vote record for address1
    const voteRecord2 = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-vote-record",
      [Cl.principal(coreProposalContactAddress), Cl.principal(address1)],
      deployer
    ).result;
    expect(voteRecord2).toStrictEqual(address1Balance.value);
  });

  ////////////////////////////////////////
  // get-total-proposals() tests
  ////////////////////////////////////////

  it("get-total-proposals() returns 0 if no proposals exist", () => {
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt.result).toBeUint(0);
  });

  it("get-total-proposals() returns the total number of proposals", () => {
    const expectedProposals = 1;
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
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    // create proposal
    const coreProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(coreProposalReceipt.result).toBeOk(Cl.bool(true));
    // get total proposals
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt.result).toBeUint(expectedProposals);
    // create 10 proposals
    const coreProposals = [
      getContract(ContractProposalType.DAO_BANK_ACCOUNT_DEPOSIT_STX),
      getContract(ContractProposalType.DAO_BANK_ACCOUNT_WITHDRAW_STX),
      getContract(ContractProposalType.DAO_BANK_ACCOUNT_SET_ACCOUNT_HOLDER),
      getContract(ContractProposalType.DAO_BASE_ADD_NEW_EXTENSION),
      getContract(ContractProposalType.DAO_BASE_DISABLE_EXTENSION),
      getContract(ContractProposalType.DAO_PAYMENTS_INVOICES_ADD_RESOURCE),
      getContract(
        ContractProposalType.DAO_PAYMENTS_INVOICES_SET_PAYMENT_ADDRESS
      ),
      getContract(ContractProposalType.DAO_TOKEN_OWNER_SET_TOKEN_URI),
      getContract(ContractProposalType.DAO_TREASURY_ALLOW_ASSET),
      getContract(ContractProposalType.DAO_TREASURY_DELEGATE_STX),
    ];
    for (let i = 0; i < 10; i++) {
      const coreProposalReceipt = simnet.callPublicFn(
        coreProposalsV2ContractAddress,
        "create-proposal",
        [Cl.principal(coreProposals[i])],
        deployer
      );
      expect(coreProposalReceipt.result).toBeOk(Cl.bool(true));
      // get total proposals
      const receipt = simnet.callReadOnlyFn(
        coreProposalsV2ContractAddress,
        "get-total-proposals",
        [],
        deployer
      );
      expect(receipt.result).toBeUint(i + 2);
    }
  });

  ////////////////////////////////////////
  // get-last-proposal-created() tests
  ////////////////////////////////////////

  it("get-last-proposal-created() succeeds and returns 0 if no proposals have been created", () => {
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-last-proposal-created",
      [],
      deployer
    );
    expect(receipt.result).toBeUint(0);
  });

  it("get-last-proposal-created() succeeds and returns the block height of the last proposal", () => {
    console.log("current epoch", simnet.currentEpoch);
    console.log(
      "clarity version",
      simnet.getDefaultClarityVersionForCurrentEpoch()
    );
    console.log("starting block", simnet.blockHeight);
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    console.log("after dao tokens receipt", simnet.blockHeight);
    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);
    console.log("after mine empty blocks", simnet.blockHeight);
    // construct the dao
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    console.log("after construct dao", simnet.blockHeight);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    console.log("after mine empty blocks", simnet.blockHeight);
    // create proposal
    const coreProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(coreProposalReceipt.result).toBeOk(Cl.bool(true));
    console.log("after create proposal", simnet.blockHeight);
    // extract createdAt
    const coreProposalReceiptEvent = coreProposalReceipt.events.find(
      (eventRecord) => eventRecord.event === "print_event"
    );
    expect(coreProposalReceiptEvent).toBeDefined();
    const coreProposalReceiptEventData = coreProposalReceiptEvent!.data.value;
    const coreProposalPrintEvent = cvToValue(coreProposalReceiptEventData!);
    const createdAt = parseInt(
      coreProposalPrintEvent.payload.value.createdAt.value
    );
    console.log("compared to createdAt", simnet.blockHeight, createdAt);
    // get last proposal created
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-last-proposal-created",
      [],
      deployer
    );
    expect(receipt.result).toBeUint(createdAt);
    // progress the chain
    simnet.mineEmptyBlocks(10);
    console.log("after mine empty blocks", simnet.blockHeight);
    // create proposal
    const coreProposalContractAddress2 = getContract(
      ContractProposalType.DAO_BASE_ENABLE_EXTENSION
    );
    const coreProposalReceipt2 = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContractAddress2)],
      deployer
    );
    expect(coreProposalReceipt2.result).toBeOk(Cl.bool(true));
    console.log("after create proposal 2", simnet.blockHeight);
    // extract createdAt
    const coreProposalReceiptEvent2 = coreProposalReceipt2.events.find(
      (eventRecord) => eventRecord.event === "print_event"
    );
    expect(coreProposalReceiptEvent2).toBeDefined();
    const coreProposalReceiptEventData2 = coreProposalReceiptEvent2!.data.value;
    const coreProposalPrintEvent2 = cvToValue(coreProposalReceiptEventData2!);
    const createdAt2 = parseInt(
      coreProposalPrintEvent2.payload.value.createdAt.value
    );
    console.log("compared to createdAt2", simnet.blockHeight, createdAt2);
    // get last proposal created
    const receipt2 = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-last-proposal-created",
      [],
      deployer
    );
    expect(receipt2.result).toBeUint(createdAt2);
  });

  ////////////////////////////////////////
  // get-voting-configuration() tests
  ////////////////////////////////////////

  it("get-voting-configuration() returns the voting configuration in the contract", () => {
    const tokenPoolContractAddress = `${deployer}.${ContractType.DAO_BITFLOW_POOL}`;
    const treasuryContractAddress = `${deployer}.${ContractType.DAO_TREASURY}`;
    const burnBlockHeight = simnet.burnBlockHeight;
    const stacksBlockHeight = simnet.stacksBlockHeight;
    const expectedResult = Cl.tuple({
      self: Cl.principal(coreProposalsV2ContractAddress),
      deployedBurnBlock: Cl.uint(burnBlockHeight),
      // not sure why this works, but matching stacksBlockHeight is way off
      deployedStacksBlock: Cl.uint(burnBlockHeight + 1),
      delay: Cl.uint(coreProposalV2VoteSettings.votingDelay),
      period: Cl.uint(coreProposalV2VoteSettings.votingPeriod),
      quorum: Cl.uint(coreProposalV2VoteSettings.votingQuorum),
      threshold: Cl.uint(coreProposalV2VoteSettings.votingThreshold),
      tokenDex: Cl.principal(tokenDexContractAddress),
      tokenPool: Cl.principal(tokenPoolContractAddress),
      treasury: Cl.principal(treasuryContractAddress),
    });
    const votingConfiguration = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
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
    const liquidSupplyResult = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-liquid-supply",
      [Cl.uint(blockHeight)],
      deployer
    ).result;
    expect(liquidSupplyResult).toBeOk(Cl.uint(liquidSupply));
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    const daoTokensReceiptEvent = daoTokensReceipt.events.find(
      (eventRecord) => eventRecord.event === "ft_transfer_event"
    );
    expect(daoTokensReceiptEvent).toBeDefined();
    liquidSupply += parseInt(daoTokensReceiptEvent!.data.amount);
    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
    // get liquid supply
    const liquidSupplyResult2 = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-liquid-supply",
      [Cl.uint(blockHeight + 2)],
      deployer
    ).result;
    expect(liquidSupplyResult2).toBeOk(Cl.uint(liquidSupply));
  });
});
