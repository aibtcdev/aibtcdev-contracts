import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext004-messaging`;

enum ErrCode {
  ERR_UNAUTHORIZED = 4000,
}

describe("aibtc-ext004-messaging", () => {
  // Message Tests
  describe("send()", () => {
    it("succeeds if called by any user with isFromDao false");
    it("fails if called by any user with isFromDao true");
    it("succeeds if called by a DAO proposal with isFromDao true");
  });
});
