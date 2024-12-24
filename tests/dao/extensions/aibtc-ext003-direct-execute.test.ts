import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtc-ext003-direct-execute`;

enum ErrCode {
  ERR_UNAUTHORIZED = 3000,
  ERR_NOT_DAO_OR_EXTENSION,
  
  ERR_NOT_INITIALIZED = 3100,
  ERR_ALREADY_INITIALIZED,
  
  ERR_TREASURY_MUST_BE_CONTRACT = 3200,
  ERR_TREASURY_CANNOT_BE_SELF,
  ERR_TREASURY_ALREADY_SET,
  ERR_TREASURY_MISMATCH,
  
  ERR_TOKEN_MUST_BE_CONTRACT = 3300,
  ERR_TOKEN_NOT_INITIALIZED,
  ERR_TOKEN_MISMATCH,
  ERR_INSUFFICIENT_BALANCE,
  
  ERR_PROPOSAL_NOT_FOUND = 3400,
  ERR_PROPOSAL_ALREADY_EXECUTED,
  ERR_PROPOSAL_STILL_ACTIVE,
  ERR_SAVING_PROPOSAL,
  ERR_PROPOSAL_ALREADY_CONCLUDED,
  
  ERR_VOTE_TOO_SOON = 3500,
  ERR_VOTE_TOO_LATE,
  ERR_ALREADY_VOTED,
  ERR_ZERO_VOTING_POWER,
  ERR_QUORUM_NOT_REACHED,
}

const withdrawalAmount = 10000000; // 10 STX
const withdrawalPeriod = 144; // 144 blocks

describe("aibtc-ext003-direct-execute", () => {});
