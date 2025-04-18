import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { TreasuryErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-treasury-withdraw-nft";
const contractAddress = `${deployer}.${contractName}`;

const expectedErr = Cl.uint(TreasuryErrCode.ERR_NOT_DAO_OR_EXTENSION);

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
