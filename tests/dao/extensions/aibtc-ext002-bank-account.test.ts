import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext002-bank-account`;

enum ErrCode {
  ERR_INVALID = 2000,
  ERR_UNAUTHORIZED,
  ERR_TOO_SOON,
  ERR_INVALID_AMOUNT,
}

const withdrawalAmount = 10000000; // 10 STX
const withdrawalPeriod = 144; // 144 blocks

describe("aibtc-ext002-bank-account", () => {
  // Account Holder Tests
  describe("set-account-holder()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if old address matches current holder");
    it("succeeds and sets new account holder");
  });

  // Withdrawal Period Tests
  describe("set-withdrawal-period()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if period is 0");
    it("succeeds and sets new withdrawal period");
  });

  // Withdrawal Amount Tests
  describe("set-withdrawal-amount()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if amount is 0");
    it("succeeds and sets new withdrawal amount");
  });

  // Last Withdrawal Block Tests
  describe("override-last-withdrawal-block()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if block is before deployment");
    it("succeeds and sets new last withdrawal block");
  });

  // Deposit Tests
  describe("deposit-stx()", () => {
    it("fails if amount is 0");
    it("succeeds and transfers STX to contract");
  });

  // Withdrawal Tests
  describe("withdraw-stx()", () => {
    it("fails if caller is not account holder");
    it("fails if withdrawing too soon");
    it("succeeds and transfers STX to account holder");
  });
});
