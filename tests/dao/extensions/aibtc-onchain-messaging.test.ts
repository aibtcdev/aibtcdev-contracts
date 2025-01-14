import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-onchain-messaging";
const contractAddress = `${deployer}.${contractName}`;

export enum ErrCode {
  INPUT_ERROR = 4000,
  ERR_UNAUTHORIZED,
}

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
  /*
  // Message Tests
  describe("send()", () => {
    it("succeeds if called by any user with isFromDao false");
    it("fails if called by any user with isFromDao true");
    it("succeeds if called by a DAO proposal with isFromDao true");
  });
  */
});
