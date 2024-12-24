import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext001-actions`;

enum ErrCode {
  ERR_UNAUTHORIZED = 1000,
  ERR_NOT_DAO_OR_EXTENSION,

  ERR_NOT_INITIALIZED = 1100,
  ERR_ALREADY_INITIALIZED,

  ERR_TREASURY_MUST_BE_CONTRACT = 1200,
  ERR_TREASURY_CANNOT_BE_SELF,
  ERR_TREASURY_ALREADY_SET,
  ERR_TREASURY_MISMATCH,

  ERR_TOKEN_MUST_BE_CONTRACT = 1300,
  ERR_TOKEN_NOT_INITIALIZED,
  ERR_TOKEN_MISMATCH,
  ERR_INSUFFICIENT_BALANCE,

  ERR_PROPOSAL_NOT_FOUND = 1400,
  ERR_PROPOSAL_ALREADY_EXECUTED,
  ERR_PROPOSAL_STILL_ACTIVE,
  ERR_SAVING_PROPOSAL,
  ERR_PROPOSAL_ALREADY_CONCLUDED,

  ERR_VOTE_TOO_SOON = 1500,
  ERR_VOTE_TOO_LATE,
  ERR_ALREADY_VOTED,
  ERR_ZERO_VOTING_POWER,
  ERR_QUORUM_NOT_REACHED,

  ERR_INVALID_ACTION = 1600,
  ERR_INVALID_PARAMETERS,
}

describe("aibtc-ext001-actions", () => {
  // Protocol Treasury Tests
  describe("set-protocol-treasury()", () => {
    it("fails if caller is not DAO or extension", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(addressDeployer, "test-treasury")],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails if treasury is not a contract", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.standardPrincipal(address1)],
        addressDeployer
      );
      expect(receipt.result).toBeErr(
        Cl.uint(ErrCode.ERR_TREASURY_MUST_BE_CONTRACT)
      );
    });

    it("fails if treasury is self", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(addressDeployer, "aibtc-ext001-actions")],
        addressDeployer
      );
      expect(receipt.result).toBeErr(
        Cl.uint(ErrCode.ERR_TREASURY_CANNOT_BE_SELF)
      );
    });

    it("fails if treasury is already set", () => {
      // First set the treasury
      simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(addressDeployer, "test-treasury")],
        addressDeployer
      );

      // Try to set it to the same value
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(addressDeployer, "test-treasury")],
        addressDeployer
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_TREASURY_ALREADY_SET));
    });

    it("succeeds and sets new treasury", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(addressDeployer, "test-treasury")],
        addressDeployer
      );
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
  });

  // Voting Token Tests
  describe("set-voting-token()", () => {
    it("fails if caller is not DAO or extension", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(addressDeployer, "test-token")],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails if token is not a contract", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.standardPrincipal(address1)],
        addressDeployer
      );
      expect(receipt.result).toBeErr(
        Cl.uint(ErrCode.ERR_TOKEN_MUST_BE_CONTRACT)
      );
    });

    it("fails if token is not initialized", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(addressDeployer, "test-token")],
        addressDeployer
      );
      expect(receipt.result).toBeErr(
        Cl.uint(ErrCode.ERR_TOKEN_NOT_INITIALIZED)
      );
    });

    it("fails if token mismatches", () => {
      // First initialize the token
      simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(addressDeployer, "test-token")],
        addressDeployer
      );

      // Try to set a different token
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(addressDeployer, "different-token")],
        addressDeployer
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_TOKEN_MISMATCH));
    });

    it("succeeds and sets new token", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(addressDeployer, "test-token")],
        addressDeployer
      );
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
  });

  // Proposal Tests
  describe("propose-action()", () => {
    it("fails if contract not initialized");
    it("fails if token mismatches");
    it("fails if caller has no balance");
    it("succeeds and creates new proposal");
  });

  // Voting Tests
  describe("vote-on-proposal()", () => {
    it("fails if contract not initialized");
    it("fails if token mismatches");
    it("fails if caller has no balance");
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
    it("fails if proposal still active");
    it("fails if proposal already concluded");
    it("succeeds and executes if passed");
    it("succeeds without executing if failed");
  });
});
