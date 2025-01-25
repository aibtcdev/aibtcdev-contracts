import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { CoreProposalV2ErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-core-proposals-v2";
const contractAddress = `${deployer}.${contractName}`;

const ErrCode = CoreProposalV2ErrCode;

// voting configuration
const votingDelay = 432; // 3 x 144 Bitcoin blocks (~3 days)
const votingPeriod = 432; // 3 x 144 Bitcoin blocks (~3 days)
const votingQuorum = 25; // 25% of liquid supply must participate
const votingThreshold = 90; // 90% of votes must be in favor

const votingTokenDex = `${deployer}.aibtc-token-dex`;
const votingToken = `${deployer}.aibtc-token`;
const votingTreasury = `${deployer}.aibtc-treasury`;

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
