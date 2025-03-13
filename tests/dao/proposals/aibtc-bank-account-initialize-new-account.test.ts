import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { OnchainMessagingErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-timed-vault-initialize-new-account";
const contractAddress = `${deployer}.${contractName}`;

const expectedErr = Cl.uint(OnchainMessagingErrCode.ERR_UNAUTHORIZED);

describe(`core proposal: ${contractName}`, () => {
  //console.log(`core proposal: ${contractName}`);
  //console.log(`contractAddress: ${contractAddress}`);
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
