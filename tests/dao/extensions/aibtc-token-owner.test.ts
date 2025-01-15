import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { TokenOwnerErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-token-owner";
const contractAddress = `${deployer}.${contractName}`;

const ErrCode = TokenOwnerErrCode;

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
});
