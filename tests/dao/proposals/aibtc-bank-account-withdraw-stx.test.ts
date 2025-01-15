import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { BankAccountErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-bank-account-withdraw-stx";
const contractAddress = `${deployer}.${contractName}`;

const expectedErr = Cl.uint(BankAccountErrCode.ERR_UNAUTHORIZED);

describe(`core proposal: ${contractName}`, () => {
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
