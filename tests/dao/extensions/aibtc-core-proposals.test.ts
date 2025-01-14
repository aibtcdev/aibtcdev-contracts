import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.aibtc-core-proposals`;

export enum ErrCode {
  ERR_NOT_DAO_OR_EXTENSION = 3000,
  ERR_FETCHING_TOKEN_DATA,
  ERR_INSUFFICIENT_BALANCE,
  ERR_PROPOSAL_NOT_FOUND,
  ERR_PROPOSAL_ALREADY_EXECUTED,
  ERR_PROPOSAL_STILL_ACTIVE,
  ERR_SAVING_PROPOSAL,
  ERR_PROPOSAL_ALREADY_CONCLUDED,
  ERR_RETRIEVING_START_BLOCK_HASH,
  ERR_VOTE_TOO_SOON,
  ERR_VOTE_TOO_LATE,
  ERR_ALREADY_VOTED,
}

const votingPeriod = 144; // 24 hours in BTC blocks
const votingQuorum = 95; // 95% quorum

describe("aibtc-core-proposals", () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });
});

/*




describe("aibtc-ext003-direct-execute", () => {
  // Protocol Treasury Tests
  describe("set-protocol-treasury()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if treasury is not a contract");
    it("fails if treasury is self");
    it("fails if treasury is already set");
    it("succeeds and sets new treasury");
  });

  // Voting Token Tests
  describe("set-voting-token()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if token is not a contract");
    it("fails if token is not initialized");
    it("fails if token mismatches");
    it("succeeds and sets new token");
  });

  // Proposal Tests
  describe("create-proposal()", () => {
    it("fails if contract not initialized");
    it("fails if token mismatches");
    it("fails if caller has no balance");
    it("fails if proposal already executed");
    it("succeeds and creates new proposal");
  });

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
