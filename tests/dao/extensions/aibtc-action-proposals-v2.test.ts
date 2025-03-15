import { Cl, cvToValue, ResponseOkCV, SomeCV } from "@stacks/transactions";
import { tx } from "@hirosystems/clarinet-sdk";
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
  dbgLog,
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
const tokenPreDexContractAddress = getContract(ContractType.DAO_TOKEN_PRE_DEX);
const tokenDexContractAddress = getContract(ContractType.DAO_TOKEN_DEX);
const tokenPoolContractAddress = getContract(ContractType.DAO_BITFLOW_POOL);
const treasuryContractAddress = getContract(ContractType.DAO_TREASURY);
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

// helper for getting start block for proposals
const getProposalStartBlock = (burnBlockHeight: number): number => {
  return burnBlockHeight + actionProposalV2VoteSettings.votingDelay;
};

// helper for getting end block for proposals
const getProposalEndBlock = (startBlock: number): number => {
  return (
    startBlock +
    actionProposalV2VoteSettings.votingPeriod +
    actionProposalV2VoteSettings.votingDelay
  );
};

// helper putting those two together
const getProposalBlocks = (burnBlockHeight: number) => {
  const startBlock = getProposalStartBlock(burnBlockHeight);
  const endBlock = getProposalEndBlock(startBlock);
  return { startBlock, endBlock };
};

// helper function to get liquid supply from total supply
function getLiquidSupply() {
  const expectedTotalSupply = 100000000000000000n;
  // get the total supply
  const totalSupplyResult = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-total-supply",
    [],
    deployer
  ).result as ResponseOkCV;
  expect(totalSupplyResult).toBeOk(Cl.uint(expectedTotalSupply));
  const totalSupply = BigInt(cvToValue(totalSupplyResult.value, true));
  //dbgLog(`totalSupply: ${totalSupply} ${typeof totalSupply}`);
  // get the balances for each contract
  const lockedSupplyContracts = [
    tokenPreDexContractAddress,
    tokenDexContractAddress,
    tokenPoolContractAddress,
    treasuryContractAddress,
  ];
  const lockedSupply = lockedSupplyContracts.reduce((acc, contractAddress) => {
    // call aibtc-token to get token supply result
    const balanceResult = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(contractAddress)],
      deployer
    ).result as ResponseOkCV;
    // convert token result to number
    const balance = BigInt(cvToValue(balanceResult.value, true));
    // add number to accumulator
    //dbgLog(`${contractAddress}`);
    //dbgLog(`${acc} + ${balance} = ${acc + balance}`);
    return acc + balance;
  }, 0n);
  return totalSupply - lockedSupply;
}

// helper function to get liquid supply from contract
const getLiquidSupplyFromContract = (blockHeight: number) => {
  const result = simnet.callReadOnlyFn(
    actionProposalsV2ContractAddress,
    "get-liquid-supply",
    [Cl.uint(blockHeight)],
    deployer
  ).result as ResponseOkCV;
  return result;
};

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
  // set-proposal-bond() tests
  ////////////////////////////////////////

  it("set-proposal-bond() fails if called directly", () => {
    // arrange
    const newBondAmount = 10000000000;
    // act
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "set-proposal-bond",
      [Cl.uint(newBondAmount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  it("set-proposal-bond() succeeds if called by a DAO proposal", () => {
    // arrange
    // setup contract names
    const proposalContractAddress = `${deployer}.${ContractProposalType.DAO_ACTION_PROPOSALS_SET_PROPOSAL_BOND}`;
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

    // act
    // conclude proposal
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsV2ContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    // assert
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
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
    // create proposals in the same block

    const actionBlock = simnet.mineBlock([
      tx.callPublicFn(
        actionProposalsV2ContractAddress,
        "propose-action",
        [
          Cl.principal(actionProposalContractAddress),
          Cl.bufferFromAscii("test"),
        ],
        deployer
      ),
      tx.callPublicFn(
        actionProposalsV2ContractAddress,
        "propose-action",
        [
          Cl.principal(actionProposalContractAddress2),
          Cl.bufferFromAscii("test2"),
        ],
        deployer
      ),
      tx.callPublicFn(
        actionProposalsV2ContractAddress,
        "propose-action",
        [
          Cl.principal(actionProposalContractAddress2),
          Cl.bufferFromAscii("test3"),
        ],
        deployer
      ),
    ]);
    //dbgLog(actionBlock);
    // review block receipts
    for (let i = 0; i < actionBlock.length; i++) {
      if (i === 0) {
        expect(actionBlock[i].result).toBeOk(Cl.bool(true));
      } else {
        expect(actionBlock[i].result).toBeErr(
          Cl.uint(ErrCode.ERR_ALREADY_PROPOSAL_AT_BLOCK)
        );
      }
    }
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

  it("conclude-proposal() succeeds but does not execute if proposal is too old (expired)", () => {
    const proposalId = 1;
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
    // progress past voting delay
    simnet.mineEmptyBlocks(actionProposalV2VoteSettings.votingDelay);
    // vote on proposal
    const voteReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
    // progress past voting period and execution delay
    simnet.mineEmptyBlocks(
      actionProposalV2VoteSettings.votingPeriod +
        actionProposalV2VoteSettings.votingDelay
    );
    // progress past expiration period (voting period + voting delay)
    simnet.mineEmptyBlocks(
      actionProposalV2VoteSettings.votingPeriod +
        actionProposalV2VoteSettings.votingDelay +
        1
    );
    // conclude proposal
    const receipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "conclude-proposal",
      [Cl.uint(proposalId), Cl.principal(actionProposalContractAddress)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(false));

    // verify proposal was concluded but not executed
    const proposalInfo = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-proposal",
      [Cl.uint(proposalId)],
      deployer
    ).result as SomeCV;
    const proposalData = proposalInfo.value as ActionProposalsV2ProposalData;
    expect(proposalData.data.concluded).toStrictEqual(Cl.bool(true));
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
    dbgLog(
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
    dbgLog(`block height: ${simnet.mineEmptyBlocks(100)}`);
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
    const proposalBond = actionProposalV2VoteSettings.votingBond;
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
    //dbgLog(`create proposal block height: ${simnet.stacksBlockHeight}`);
    const createdAtStacksBlock = simnet.stacksBlockHeight;
    const createdAtBurnBlock = simnet.burnBlockHeight;
    const { startBlock, endBlock } = getProposalBlocks(createdAtBurnBlock);
    const actionProposalReceipt = simnet.callPublicFn(
      actionProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(actionProposalContractAddress), actionProposalData],
      deployer
    );
    expect(actionProposalReceipt.result).toBeOk(Cl.bool(true));
    const actionProposalReceiptEvent = actionProposalReceipt.events.find(
      (eventRecord) => eventRecord.event === "print_event"
    );
    expect(actionProposalReceiptEvent).toBeDefined();
    const actionProposalReceiptEventData =
      actionProposalReceiptEvent!.data.value;
    expect(actionProposalReceiptEventData).toBeDefined();
    const actionProposalPrintEvent = cvToValue(actionProposalReceiptEventData!);
    const createdAt = parseInt(
      actionProposalPrintEvent.payload.value.createdAt.value
    );
    expect(createdAt).toBe(createdAtStacksBlock);
    // get the liquid supply
    const expectedLiquidSupply = getLiquidSupply();
    // get proposal
    const proposalInfo = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-proposal",
      [Cl.uint(proposalId)],
      deployer
    ).result;
    // setup expected proposal data
    const expectedResult = Cl.some(
      Cl.tuple({
        action: Cl.principal(actionProposalContractAddress),
        caller: Cl.principal(deployer),
        concluded: Cl.bool(false),
        createdAt: Cl.uint(createdAtStacksBlock),
        creator: Cl.principal(deployer),
        bond: Cl.uint(proposalBond),
        endBlock: Cl.uint(endBlock),
        executed: Cl.bool(false),
        liquidTokens: Cl.uint(expectedLiquidSupply),
        metQuorum: Cl.bool(false),
        metThreshold: Cl.bool(false),
        parameters: Cl.bufferFromHex("0x74657374"),
        passed: Cl.bool(false),
        startBlock: Cl.uint(startBlock),
        votesAgainst: Cl.uint(0),
        votesFor: Cl.uint(0),
      })
    );
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
    dbgLog(
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
      dbgLog({
        blockHeight,
        burnBlockHeight,
        stacksBlockHeight,
      });
    };
    // helper function for calling read-only function
    // get-block-hash with a block height, result: some/none
    /* REMOVED no longer read-only, back to private
    const getBlockHash = (blockHeight: number) => {
      const receipt = simnet.callReadOnlyFn(
        actionProposalsV2ContractAddress,
        "get-block-hash",
        [Cl.uint(blockHeight)],
        deployer
      );
      const result = cvToValue(receipt.result);
      dbgLog(
        `block hash at ${blockHeight}: ${result ? result.value : "none"}`
      );
    };
    */
    // progress the chain so we're out of deployment range
    simnet.mineEmptyBurnBlocks(10);
    // log starting info
    dbgLog("\n-- starting the test:");
    logBlockHeights();
    // get dao tokens for deployer, increases liquid tokens
    dbgLog("\n-- getting dao tokens...");
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    dbgLog("after fetching dao tokens:");
    dbgLog(`tx result: ${cvToValue(daoTokensReceipt.result, true).value}`);
    logBlockHeights();
    // progress the chain for at-block calls
    // pushing this higher to make sure past blocks exist
    const blocks = 1000;
    dbgLog(`\n-- progressing ${blocks} blocks`);
    const progressOutput = simnet.mineEmptyBlocks(blocks);
    dbgLog(`returned from simnet.mineEmptyBlocks(blocks): ${progressOutput}`);
    dbgLog("after progressing blocks:");
    logBlockHeights();
    // construct the dao
    dbgLog("\n-- constructing the dao...");
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    dbgLog("after dao is constructed:");
    logBlockHeights();
    dbgLog(`\n-- progressing ${blocks} blocks`);
    const progressOutput2 = simnet.mineEmptyBlocks(blocks);
    dbgLog(`returned from simnet.mineEmptyBlocks(blocks): ${progressOutput2}`);
    dbgLog("after progressing blocks:");
    logBlockHeights();
    // verify get-block-hash at past block heights
    dbgLog("\n-- verifying get-block-hash at past block heights");
    for (let i = 0; i < blockHeights.blockHeights.length; i++) {
      const blockHeight = blockHeights.blockHeights[i];
      const burnBlockHeight = blockHeights.burnBlockHeights[i];
      const stacksBlockHeight = blockHeights.stacksBlockHeights[i];
      dbgLog(
        `\nblock heights: ${JSON.stringify({
          blockHeight,
          burnBlockHeight,
          stacksBlockHeight,
        })}`
      );
      // log block hash and supply
      //getBlockHash(blockHeight);
      getLiquidSupplyFromContract(blockHeight);
      //getBlockHash(burnBlockHeight);
      getLiquidSupplyFromContract(burnBlockHeight);
      //getBlockHash(stacksBlockHeight);
      getLiquidSupplyFromContract(stacksBlockHeight);
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
    dbgLog(
      `\none block before current: ${JSON.stringify({
        lastBlockHeight,
        lastBurnBlockHeight,
        lastStacksBlockHeight,
      })}`
    );
    //getBlockHash(lastBlockHeight);
    getLiquidSupplyFromContract(lastBlockHeight);
    //getBlockHash(lastBurnBlockHeight);
    getLiquidSupplyFromContract(lastBurnBlockHeight);
    //getBlockHash(lastStacksBlockHeight);
    getLiquidSupplyFromContract(lastStacksBlockHeight);

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
    const proposalBond = actionProposalV2VoteSettings.votingBond;
    const burnBlockHeight = simnet.burnBlockHeight;
    // const stacksBlockHeight = simnet.stacksBlockHeight;
    const expectedResult = Cl.tuple({
      self: Cl.principal(actionProposalsV2ContractAddress),
      deployedBurnBlock: Cl.uint(burnBlockHeight),
      // not sure why this works, but matching stacksBlockHeight is way off
      deployedStacksBlock: Cl.uint(burnBlockHeight + 1),
      proposalBond: Cl.uint(proposalBond),
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
    // arrange
    // store blockheight to check later
    const blockHeightBeforeCall = simnet.blockHeight;
    // progress chain by 10 burn blocks for at block call
    simnet.mineEmptyBurnBlocks(10);
    // get the liquid supply
    const expectedLiquidSupply = getLiquidSupply();
    // act
    const contractLiquidSupply = getLiquidSupplyFromContract(
      blockHeightBeforeCall
    );
    // assert
    expect(contractLiquidSupply).toBeOk(Cl.uint(expectedLiquidSupply));
  });

  ////////////////////////////////////////
  // get-proposal-bond() tests
  ////////////////////////////////////////
  it("get-proposal-bond() returns the proposal bond set in the contract", () => {
    // arrange
    const proposalBond = actionProposalV2VoteSettings.votingBond;
    // act
    const receipt = simnet.callReadOnlyFn(
      actionProposalsV2ContractAddress,
      "get-proposal-bond",
      [],
      deployer
    );
    // assert
    expect(receipt.result).toStrictEqual(Cl.uint(proposalBond));
  });
});
