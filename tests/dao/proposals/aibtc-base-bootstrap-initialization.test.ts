import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCode } from "../aibtcdev-base-dao.test";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-base-bootstrap-initialization";
const contractAddress = `${deployer}.${contractName}`;

const expectedErr = Cl.uint(ErrCode.ERR_UNAUTHORIZED);

const daoManifest =
  "This is where the DAO can put it's mission, purpose, and goals.";

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
  it("get-dao-manifest() returns DAO_MANIFEST as string", () => {
    const receipt = simnet.callReadOnlyFn(
      contractAddress,
      "get-dao-manifest",
      [],
      deployer
    );
    expect(receipt.result).toStrictEqual(Cl.stringAscii(daoManifest));
  });
});
