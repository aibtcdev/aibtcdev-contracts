import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { BaseDaoErrCode } from "../error-codes";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtcdev-base-dao";
const contractAddress = `${deployer}.${contractName}`;

const ErrCode = BaseDaoErrCode;

describe(`base dao: ${contractName}`, () => {
  it("should have tests written", () => {
    expect(true).toBe(true);
  });
  /*
  // Extension Management Tests
  describe("set-extension()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and sets extension status");
  });

  describe("set-extensions()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and sets multiple extension statuses");
  });

  // Execution Tests
  describe("execute()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and executes proposal");
  });

  // Construction Tests
  describe("construct()", () => {
    it("fails when called by an account that is not the deployer");
    it("fails when initializing the DAO with bootstrap proposal a second time");
    it("succeeds when initializing the DAO with bootstrap proposal");
  });

  // Extension Callback Tests
  describe("request-extension-callback()", () => {
    it("fails if caller is not an extension");
    it("succeeds and calls an extension");
  });

  // Query Tests
  describe("is-extension()", () => {
    it("succeeds and returns false with unrecognized extension");
    it("succeeds and returns true for active extensions");
  });

  describe("executed-at()", () => {
    it("succeeds and returns none with unrecognized proposal");
    it(
      "succeeds and returns the Bitcoin block height the proposal was executed"
    );
  });
  */
});
