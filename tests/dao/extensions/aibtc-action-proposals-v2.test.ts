import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ActionProposalsV2ErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-action-proposals-v2";
const contractAddress = `${deployer}.${contractName}`;

const votingDelay = 144; // 144 Bitcoin blocks (~1 day)
const votingPeriod = 288; // 2 x 144 Bitcoin blocks (~2 days)
const votingQuorum = 15; // 15% of liquid supply must participate
const votingThreshold = 66; // 66% of votes must be in favor

const votingTokenDex = `${deployer}.aibtc-token-dex`;
const votingToken = `${deployer}.aibtc-token`;
const votingTreasury = `${deployer}.aibtc-treasury`;

const ErrCode = ActionProposalsV2ErrCode;

describe(`extension: ${contractName}`, () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });
});
