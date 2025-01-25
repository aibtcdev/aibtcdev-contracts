import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { BaseDaoErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-base-bootstrap-initialization-v2";
const contractAddress = `${deployer}.${contractName}`;

// first call to baes dao fails
const expectedErr = Cl.uint(BaseDaoErrCode.ERR_UNAUTHORIZED);

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
