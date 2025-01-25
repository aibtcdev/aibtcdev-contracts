import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { CoreProposalV2ErrCode } from "../../error-codes";
import { VOTING_CONFIG } from "../../test-utilities";
import { ContractType } from "../../dao-types";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-core-proposals-v2";
const contractAddress = `${deployer}.${contractName}`;

const ErrCode = CoreProposalV2ErrCode;

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
