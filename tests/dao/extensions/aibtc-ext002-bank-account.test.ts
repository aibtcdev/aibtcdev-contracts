import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext002-bank-account`;

enum ErrCode {
  ERR_INVALID = 2000,
  ERR_UNAUTHORIZED,
  ERR_TOO_SOON,
  ERR_INVALID_AMOUNT,
}

const withdrawalAmount = 10000000; // 10 STX
const withdrawalPeriod = 144; // 144 blocks

describe("aibtc-ext002-bank-account", () => {});
