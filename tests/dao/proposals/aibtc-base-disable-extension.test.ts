import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCode } from "../aibtcdev-base-dao.test";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const contractName = "aibtc-base-disable-extension";
const contractAddress = `${deployer}.${contractName}`;

// custom error because proposal is not found / setup yet
const expectedErr = Cl.uint(404);

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
