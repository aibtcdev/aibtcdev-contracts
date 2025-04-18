import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { OnchainMessagingErrCode } from "../../error-codes";
import { ContractProposalType } from "../../dao-types";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractAddress = `${deployer}.${ContractProposalType.DAO_TIMED_VAULT_STX_WITHDRAW}`;

const expectedErr = Cl.uint(OnchainMessagingErrCode.ERR_NOT_DAO_OR_EXTENSION);

describe(`core proposal: ${ContractProposalType.DAO_TIMED_VAULT_STX_WITHDRAW}`, () => {
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
