import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.aibtc-base-bootstrap-initialization`;

const daoManifest =
  "This is where the DAO can put it's mission, purpose, and goals.";

describe("aibtc-base-bootstrap-proposal", () => {
  // Manifest Tests
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
