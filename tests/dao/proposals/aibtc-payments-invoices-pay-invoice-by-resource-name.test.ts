import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { PaymentsInvoicesErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-payments-invoices-pay-invoice-by-resource-name";
const contractAddress = `${deployer}.${contractName}`;

const expectedErr = Cl.uint(PaymentsInvoicesErrCode.ERR_RESOURCE_NOT_FOUND);

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
