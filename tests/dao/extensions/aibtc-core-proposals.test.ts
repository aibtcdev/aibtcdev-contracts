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
});

/*




describe("aibtc-ext003-direct-execute", () => {
  // Voting Tests
  describe("vote-on-proposal()", () => {
    it("fails if contract not initialized");
    it("fails if token mismatches");
    it("fails if caller has no balance");
    it("fails if proposal already executed");
    it("fails if voting too soon");
    it("fails if voting too late");
    it("fails if proposal concluded");
    it("fails if already voted");
    it("succeeds and records vote");
  });

  // Conclusion Tests
  describe("conclude-proposal()", () => {
    it("fails if contract not initialized");
    it("fails if treasury mismatches");
    it("fails if proposal already executed");
    it("fails if proposal still active");
    it("fails if proposal already concluded");
    it("succeeds and executes if passed");
    it("succeeds without executing if failed");
  });
});

*/
