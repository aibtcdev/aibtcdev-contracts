import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ActionProposalsErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-action-proposals-v2";
const contractAddress = `${deployer}.${contractName}`;

const votingPeriod = 144; // 24 hours in BTC blocks
const votingQuorum = 66; // 66% quorum

const ErrCode = ActionProposalsErrCode;

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
