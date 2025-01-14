import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCode } from "../extensions/aibtc-bank-account.test";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-bank-account-set-withdrawal-amount";
const contractAddress = `${deployer}.${contractName}`;

const expectedErr = Cl.uint(ErrCode.ERR_UNAUTHORIZED);

describe(contractName, () => {
  it("execute() fails if called directly", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "execute",
      [Cl.principal(deployer)],
      deployer
    );
    expect(receipt.result).toBeErr(expectedErr);
  });
});
