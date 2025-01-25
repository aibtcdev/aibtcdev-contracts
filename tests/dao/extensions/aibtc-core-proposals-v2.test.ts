import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { CoreProposalErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-core-proposals-v2";
const contractAddress = `${deployer}.${contractName}`;

const ErrCode = CoreProposalErrCode;

const votingPeriod = 144; // 24 hours in BTC blocks
const votingQuorum = 95; // 95% quorum

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
