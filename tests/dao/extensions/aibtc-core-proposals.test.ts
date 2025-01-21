import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { CoreProposalErrCode } from "../../error-codes";
import {
  constructDao,
  fundVoters,
  getDaoTokens,
  passCoreProposal,
} from "../../test-utilities";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const contractName = "aibtc-core-proposals";
const contractAddress = `${deployer}.${contractName}`;
const proposalContractAddress = `${deployer}.aibtc-onchain-messaging-send`;

const ErrCode = CoreProposalErrCode;

const votingPeriod = 144; // 24 hours in BTC blocks
const votingQuorum = 95; // 95% quorum

describe(`extension: ${contractName}`, () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });
  it("create-proposal() fails if called in the first voting period", () => {
    const response = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_FIRST_VOTING_PERIOD));
  });
  it("create-proposal() fails if the proposer does not hold the voting token", () => {
    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    // and to pass first core proposal voting period
    simnet.mineEmptyBlocks(votingPeriod);

    const response = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      address1
    );
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });
  it("create-proposal() fails if the proposal is already concluded", () => {
    // fund accounts for creating and voting on proposals
    fundVoters(deployer, [deployer, address1, address2]);

    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    // and to pass first core proposal voting period
    simnet.mineEmptyBlocks(votingPeriod);

    // pass proposal
    const proposalTx = passCoreProposal(proposalContractAddress, deployer, [
      deployer,
      address1,
      address2,
    ]);
    expect(proposalTx.result).toBeOk(Cl.bool(true));

    // try to create same proposal again
    const response = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );
    expect(response.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_EXECUTED)
    );
  });
  it("create-proposal() succeeds and creates a new proposal", () => {
    // fund accounts for creating and voting on proposals
    fundVoters(deployer, [deployer, address1, address2]);

    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    // and to pass first core proposal voting period
    simnet.mineEmptyBlocks(votingPeriod);

    // create proposal
    const response = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );
    expect(response.result).toBeOk(Cl.bool(true));
  });
  it("vote-on-proposal() fails if the proposal is not found", () => {
    const response = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      deployer
    );
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });
  it("vote-on-proposal() fails the voter does not hold the voting token at the proposal height", () => {
    // fund deployer to allow creating a proposal
    const { swappedAmount, getDaoTokensReceipt } = getDaoTokens(
      deployer,
      deployer,
      1000
    );
    expect(getDaoTokensReceipt.result).toBeOk(Cl.uint(swappedAmount));

    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    // and to pass first core proposal voting period
    simnet.mineEmptyBlocks(votingPeriod);

    // create proposal
    const createProposalResponse = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );
    expect(createProposalResponse.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(1);

    // vote on proposal
    const voteResponse = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      address1
    );
    expect(voteResponse.result).toBeErr(
      Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE)
    );

    // fund the voters after the fact
    fundVoters(deployer, [address1]);

    // try to vote on proposal again
    const voteResponse2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      address1
    );
    expect(voteResponse2.result).toBeErr(
      Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE)
    );
  });
  it("vote-on-proposal() fails if the vote period has ended", () => {
    // fund deployer to allow creating a proposal
    const { swappedAmount, getDaoTokensReceipt } = getDaoTokens(
      deployer,
      deployer,
      1000
    );
    expect(getDaoTokensReceipt.result).toBeOk(Cl.uint(swappedAmount));

    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    // and to pass first core proposal voting period
    simnet.mineEmptyBlocks(votingPeriod);

    // create proposal
    const createProposalResponse = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );
    expect(createProposalResponse.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    simnet.mineEmptyBlocks(votingPeriod);

    // vote on proposal
    const voteResponse = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      deployer
    );
    expect(voteResponse.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_LATE));
  });
  it("vote-on-proposal() fails if the voter has already voted", () => {
    // fund deployer to allow creating a proposal
    const { swappedAmount, getDaoTokensReceipt } = getDaoTokens(
      deployer,
      deployer,
      1000
    );
    expect(getDaoTokensReceipt.result).toBeOk(Cl.uint(swappedAmount));

    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    // and to pass first core proposal voting period
    simnet.mineEmptyBlocks(votingPeriod);

    // create proposal
    const createProposalResponse = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );
    expect(createProposalResponse.result).toBeOk(Cl.bool(true));

    // vote on proposal
    const voteResponse = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      deployer
    );
    expect(voteResponse.result).toBeOk(Cl.bool(true));

    // try to vote on proposal again
    const voteResponse2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      deployer
    );
    expect(voteResponse2.result).toBeErr(Cl.uint(ErrCode.ERR_ALREADY_VOTED));
  });
  it("vote-on-proposal() succeeds and records a vote", () => {
    // fund deployer to allow creating a proposal
    const { swappedAmount, getDaoTokensReceipt } = getDaoTokens(
      deployer,
      deployer,
      1000
    );
    expect(getDaoTokensReceipt.result).toBeOk(Cl.uint(swappedAmount));

    // construct DAO
    const constructReceipt = constructDao(deployer);
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // progress the chain for at-block calls
    // and to pass first core proposal voting period
    simnet.mineEmptyBlocks(votingPeriod);

    // create proposal
    const createProposalResponse = simnet.callPublicFn(
      contractAddress,
      "create-proposal",
      [Cl.principal(proposalContractAddress)],
      deployer
    );
    expect(createProposalResponse.result).toBeOk(Cl.bool(true));

    // vote on proposal
    const voteResponse = simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      deployer
    );
    expect(voteResponse.result).toBeOk(Cl.bool(true));
  });
});
