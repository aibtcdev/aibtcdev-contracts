import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext005-payments`;

enum ErrCode {
  ERR_UNAUTHORIZED = 5000,
  ERR_INVALID_PARAMS,
  ERR_NAME_ALREADY_USED,
  ERR_SAVING_RESOURCE_DATA,
  ERR_DELETING_RESOURCE_DATA,
  ERR_RESOURCE_NOT_FOUND,
  ERR_RESOURCE_DISABLED,
  ERR_USER_ALREADY_EXISTS,
  ERR_SAVING_USER_DATA,
  ERR_USER_NOT_FOUND,
  ERR_INVOICE_ALREADY_PAID,
  ERR_SAVING_INVOICE_DATA,
  ERR_INVOICE_NOT_FOUND,
  ERR_RECENT_PAYMENT_NOT_FOUND,
}

describe("aibtc-ext005-payments", () => {});
