import { Cl, cvToValue, ResponseOkCV, SomeCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { CoreProposalV2ErrCode } from "../../error-codes";
import {
  constructDao,
  dbgLog,
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
const tokenPreDexContractAddress = getContract(ContractType.DAO_TOKEN_PRE_DEX);
const tokenDexContractAddress = getContract(ContractType.DAO_TOKEN_DEX);
const tokenPoolContractAddress = getContract(ContractType.DAO_BITFLOW_POOL);
const treasuryContractAddress = getContract(ContractType.DAO_TREASURY);
const baseDaoContractAddress = getContract(ContractType.DAO_BASE);
const bootstrapContractAddress = getContract(
  ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
);
// general vote settings configurations
const coreProposalV2VoteSettings =
  VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
// import contract error codes
const ErrCode = CoreProposalV2ErrCode;

// generic context for creating proposals
const memoContext = "Can pass up to 1024 characters for additional context.";

// helper for getting start block for proposals
const getProposalStartBlock = (burnBlockHeight: number): number => {
  return burnBlockHeight + coreProposalV2VoteSettings.votingDelay;
};

// helper for getting end block for proposals
const getProposalEndBlock = (startBlock: number): number => {
  return (
    startBlock +
    coreProposalV2VoteSettings.votingPeriod +
    coreProposalV2VoteSettings.votingDelay
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
  // set-proposal-bond() tests
  ////////////////////////////////////////

  it("set-proposal-bond() fails if called directly", () => {
    // arrange
    const newBondAmount = 10000000000;
    // act
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
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
    const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
    const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
    const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
    const coreProposalsContractAddress = `${deployer}.${ContractType.DAO_CORE_PROPOSALS_V2}`;
    const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;
    const proposalContractAddress = `${deployer}.${ContractProposalType.DAO_CORE_PROPOSALS_SET_PROPOSAL_BOND}`;
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
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    // assert
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // create-proposal() tests
  ////////////////////////////////////////

  it("create-proposal() fails if the liquid tokens are 0", () => {
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
        coreProposalV2VoteSettings.votingDelay +
        1
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
    const proposalBond = coreProposalV2VoteSettings.votingBond;
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
    // create core proposal
    const createdAtStacksBlock = simnet.stacksBlockHeight;
    const createdAtBurnBlock = simnet.burnBlockHeight;
    const { startBlock, endBlock } = getProposalBlocks(createdAtBurnBlock);
    const createProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    const createProposalReceiptEvent = createProposalReceipt.events.find(
      (eventRecord) => eventRecord.event === "print_event"
    );
    expect(createProposalReceiptEvent).toBeDefined();
    const createProposalReceiptEventData =
      createProposalReceiptEvent!.data.value;
    expect(createProposalReceiptEvent).toBeDefined();
    const createProposalPrintEvent = cvToValue(createProposalReceiptEventData!);
    const createdAt = parseInt(
      createProposalPrintEvent.payload.value.createdAt.value
    );
    expect(createdAt).toBe(createdAtStacksBlock);
    // get liquid supply
    const expectedLiquidSupply = getLiquidSupply();
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
        memo: Cl.some(Cl.stringAscii(memoContext)),
        bond: Cl.uint(proposalBond),
        startBlock: Cl.uint(startBlock), // createdAt + coreProposalV2VoteSettings.votingDelay
        endBlock: Cl.uint(endBlock), // createdAt + coreProposalV2VoteSettings.votingDelay + coreProposalV2VoteSettings.votingPeriod
        votesFor: Cl.uint(0),
        votesAgainst: Cl.uint(0),
        liquidTokens: Cl.uint(expectedLiquidSupply),
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
    const coreProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      deployer
    );
    expect(coreProposalReceipt.result).toBeOk(Cl.bool(true));
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
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
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
      getContract(ContractProposalType.DAO_ACTION_PROPOSALS_SET_PROPOSAL_BOND),
      getContract(ContractProposalType.DAO_TIMED_VAULT_STX_WITHDRAW),
      getContract(ContractProposalType.DAO_TIMED_VAULT_STX_SET_ACCOUNT_HOLDER),
      getContract(ContractProposalType.DAO_BASE_ADD_NEW_EXTENSION),
      getContract(ContractProposalType.DAO_BASE_DISABLE_EXTENSION),
      getContract(ContractProposalType.DAO_PMT_DAO_SET_PAYMENT_ADDRESS),
      getContract(ContractProposalType.DAO_PMT_SBTC_SET_PAYMENT_ADDRESS),
      getContract(ContractProposalType.DAO_TOKEN_OWNER_SET_TOKEN_URI),
      getContract(ContractProposalType.DAO_TREASURY_ALLOW_ASSET),
      getContract(ContractProposalType.DAO_TREASURY_DELEGATE_STX),
    ];
    for (let i = 0; i < 10; i++) {
      const coreProposalReceipt = simnet.callPublicFn(
        coreProposalsV2ContractAddress,
        "create-proposal",
        [
          Cl.principal(coreProposals[i]),
          i % 2 === 0 ? Cl.some(Cl.stringAscii(memoContext)) : Cl.none(),
        ],
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
    dbgLog(simnet.currentEpoch, { titleBefore: "current epoch" });
    dbgLog(simnet.getDefaultClarityVersionForCurrentEpoch(), {
      titleBefore: "clarity version",
    });
    dbgLog(simnet.blockHeight, { titleBefore: "starting block" });
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000
    );
    expect(daoTokensReceipt.result).toBeOk(Cl.bool(true));
    dbgLog(simnet.blockHeight, { titleBefore: "after dao tokens receipt" });
    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(10);
    dbgLog(simnet.blockHeight, { titleBefore: "after mine empty blocks" });
    // construct the dao
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    dbgLog(simnet.blockHeight, { titleBefore: "after construct dao" });
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalV2VoteSettings.votingPeriod);
    dbgLog(simnet.blockHeight, { titleBefore: "after mine empty blocks" });
    // create proposal
    const coreProposalReceipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [
        Cl.principal(coreProposalContactAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      deployer
    );
    expect(coreProposalReceipt.result).toBeOk(Cl.bool(true));
    dbgLog(simnet.blockHeight, { titleBefore: "after create proposal" });
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
    dbgLog(`${simnet.blockHeight}, ${createdAt}`, {
      titleBefore: "compared to createdAt",
    });
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
    dbgLog(simnet.blockHeight, { titleBefore: "after mine empty blocks" });
    // create proposal
    const coreProposalContractAddress2 = getContract(
      ContractProposalType.DAO_BASE_ENABLE_EXTENSION
    );
    const coreProposalReceipt2 = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "create-proposal",
      [Cl.principal(coreProposalContractAddress2), Cl.none()],
      deployer
    );
    expect(coreProposalReceipt2.result).toBeOk(Cl.bool(true));
    dbgLog(simnet.blockHeight, { titleBefore: "after create proposal 2" });
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
    dbgLog(simnet.blockHeight, { titleBefore: "compared to createdAt2" });
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
    const proposalBond = coreProposalV2VoteSettings.votingBond;
    const tokenPoolContractAddress = `${deployer}.${ContractType.DAO_BITFLOW_POOL}`;
    const treasuryContractAddress = `${deployer}.${ContractType.DAO_TREASURY}`;
    const burnBlockHeight = simnet.burnBlockHeight;
    const stacksBlockHeight = simnet.stacksBlockHeight;
    const expectedResult = Cl.tuple({
      self: Cl.principal(coreProposalsV2ContractAddress),
      // not sure why this works
      deployedBurnBlock: Cl.uint(burnBlockHeight),
      deployedStacksBlock: Cl.uint(burnBlockHeight + 2),
      proposalBond: Cl.uint(proposalBond),
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
    // arrange
    const blockHeightBeforeCall = simnet.blockHeight;
    // progress chain by 10 burn blocks for at-block call
    simnet.mineEmptyBurnBlocks(10);
    // get the liquid supply
    const expectedLiquidSupply = getLiquidSupply();
    //dbgLog(`expectedLiquidSupply: ${expectedLiquidSupply}`);
    // get the liquid supply
    const liquidSupplyResult = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-liquid-supply",
      [Cl.uint(blockHeightBeforeCall)],
      deployer
    ).result as ResponseOkCV;
    //dbgLog(
    //  `liquidSupplyResult: ${cvToValue(liquidSupplyResult.value, true)}`
    //);
    expect(liquidSupplyResult).toBeOk(Cl.uint(expectedLiquidSupply));
    // get dao tokens for deployer, increases liquid tokens
    const daoTokensResult = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      10000
    ).result;
    expect(daoTokensResult).toBeOk(Cl.bool(true));
    // arrange part 2
    const blockHeightBeforeCall2 = simnet.blockHeight;
    // progress chain for at-block calls
    simnet.mineEmptyBurnBlocks(10);
    // get the liquid supply
    const expectedLiquidSupply2 = getLiquidSupply();
    dbgLog(`expectedLiquidSupply2: ${expectedLiquidSupply2}`);
    // get the liquid supply
    const liquidSupplyResult2 = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-liquid-supply",
      [Cl.uint(blockHeightBeforeCall2)],
      deployer
    ).result as ResponseOkCV;
    dbgLog(
      `liquidSupplyResult2: ${cvToValue(liquidSupplyResult2.value, true)}`
    );
    expect(liquidSupplyResult2).toBeOk(Cl.uint(expectedLiquidSupply2));
  });

  ////////////////////////////////////////
  // get-proposal-bond() tests
  ////////////////////////////////////////
  it("get-proposal-bond() returns the proposal bond set in the contract", () => {
    // arrange
    const proposalBond = coreProposalV2VoteSettings.votingBond;
    // act
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-proposal-bond",
      [],
      deployer
    );
    // assert
    expect(receipt.result).toStrictEqual(Cl.uint(proposalBond));
  });
});
