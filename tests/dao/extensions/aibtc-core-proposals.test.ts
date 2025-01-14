import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.aibtc-core-proposals`;

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

enum ErrCode {
  ERR_UNAUTHORIZED = 3000,
  ERR_NOT_DAO_OR_EXTENSION,

  ERR_NOT_INITIALIZED = 3100,
  ERR_ALREADY_INITIALIZED,

  ERR_TREASURY_MUST_BE_CONTRACT = 3200,
  ERR_TREASURY_CANNOT_BE_SELF,
  ERR_TREASURY_ALREADY_SET,
  ERR_TREASURY_MISMATCH,

  ERR_TOKEN_MUST_BE_CONTRACT = 3300,
  ERR_TOKEN_NOT_INITIALIZED,
  ERR_TOKEN_MISMATCH,
  ERR_INSUFFICIENT_BALANCE,

  ERR_PROPOSAL_NOT_FOUND = 3400,
  ERR_PROPOSAL_ALREADY_EXECUTED,
  ERR_PROPOSAL_STILL_ACTIVE,
  ERR_SAVING_PROPOSAL,
  ERR_PROPOSAL_ALREADY_CONCLUDED,

  ERR_VOTE_TOO_SOON = 3500,
  ERR_VOTE_TOO_LATE,
  ERR_ALREADY_VOTED,
  ERR_ZERO_VOTING_POWER,
  ERR_QUORUM_NOT_REACHED,
}


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
