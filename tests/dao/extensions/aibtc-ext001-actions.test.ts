import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext001-actions`;

enum ErrCode {
  ERR_UNAUTHORIZED = 1000,
  ERR_NOT_DAO_OR_EXTENSION,
  ERR_NOT_INITIALIZED = 1100,
  ERR_ALREADY_INITIALIZED,
  ERR_TREASURY_MUST_BE_CONTRACT = 1200,
  ERR_TREASURY_CANNOT_BE_SELF,
  ERR_TREASURY_ALREADY_SET,
  ERR_TREASURY_MISMATCH,
}

const withdrawalAmount = 10000000; // 10 STX
const withdrawalPeriod = 144; // 144 blocks

describe("aibtc-ext001-actions", () => {});
