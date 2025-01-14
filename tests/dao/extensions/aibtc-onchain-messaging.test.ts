import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.aibtc-onchain-messaging`;

enum ErrCode {
  ERR_UNAUTHORIZED = 4000,
}

describe("aibtc-onchain-messaging", () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });
  /*
  // Message Tests
  describe("send()", () => {
    it("succeeds if called by any user with isFromDao false");
    it("fails if called by any user with isFromDao true");
    it("succeeds if called by a DAO proposal with isFromDao true");
  });
  */
});
