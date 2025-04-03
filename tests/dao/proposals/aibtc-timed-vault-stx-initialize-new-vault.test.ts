import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { OnchainMessagingErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-timed-vault-stx-initialize-new-vault";
const contractAddress = `${deployer}.${contractName}`;

const expectedErr = Cl.uint(OnchainMessagingErrCode.ERR_UNAUTHORIZED);

describe(`core proposal: ${contractName}`, () => {
  //dbgLog(`core proposal: ${contractName}`);
  //dbgLog(`contractAddress: ${contractAddress}`);
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
