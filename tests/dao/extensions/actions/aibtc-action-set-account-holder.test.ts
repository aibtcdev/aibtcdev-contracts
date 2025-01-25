import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ContractActionType } from "../../../dao-types";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.${ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER}`;

describe(`action extension: ${ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER}`, () => {
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
