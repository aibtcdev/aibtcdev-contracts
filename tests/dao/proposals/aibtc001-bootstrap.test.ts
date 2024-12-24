import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-prop001-bootstrap`;

describe("aibtc-prop001-bootstrap", () => {
  // Manifest Tests
  describe("get-dao-manifest()", () => {
    it("returns DAO_MANIFEST as string");
  });
});
