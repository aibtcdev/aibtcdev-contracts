import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext006-treasury`;

enum ErrCode {
  ERR_UNAUTHORIZED = 6000,
  ERR_UNKNOWN_ASSSET = 6001,
}

describe("aibtc-ext006-treasury", () => {
  // Allow Asset Tests
  describe("allow-asset()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and sets new allowed asset");
    it("succeeds and toggles status of existing asset");
  });

  // Allow Assets Tests
  describe("allow-assets()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and sets new allowed assets");
    it("succeeds and toggles status of existing assets");
  });

  // Deposit STX Tests
  describe("deposit-stx()", () => {
    it("succeeds and deposits STX to the treasury");
  });

  // Deposit FT Tests
  describe("deposit-ft()", () => {
    it("fails if asset is not allowed");
    it("succeeds and transfers FT to treasury");
  });

  // Deposit NFT Tests
  describe("deposit-nft()", () => {
    it("fails if asset is not allowed");
    it("succeeds and transfers NFT to treasury");
  });

  // Withdraw STX Tests
  describe("withdraw-stx()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and transfers STX to a standard principal");
    it("succeeds and transfers STX to a contract principal");
  });

  // Withdraw FT Tests
  describe("withdraw-ft()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and transfers FT to a standard principal");
    it("succeeds and transfers FT to a contract principal");
  });

  // Withdraw NFT Tests
  describe("withdraw-nft()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and transfers NFT to a standard principal");
    it("succeeds and transfers NFT to a contract principal");
  });

  // Delegate STX Tests
  describe("delegate-stx()", () => {
    it("fails if caller is not DAO or extension");
    it("succeeds and delegates to Stacks PoX");
  });

  // Revoke Delegate STX Tests
  describe("revoke-delegate-stx()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if contract is not currently stacking");
    it("succeeds and revokes stacking delegation");
  });
});
