import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../../dao-types";
import { ActionErrCode } from "../../../error-codes";
import {
  constructDao,
  fundVoters,
  passActionProposal,
  VOTING_CONFIG,
} from "../../../test-utilities";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

const contractAddress = `${deployer}.${ContractActionType.DAO_ACTION_CONFIGURE_TIMED_VAULT_DAO}`;

describe(`action extension: ${ContractActionType.DAO_ACTION_CONFIGURE_TIMED_VAULT_DAO}`, () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  it("run() fails if called directly", () => {
    const accountHolder = Cl.some(Cl.principal(address3));
    const withdrawalAmount = Cl.some(Cl.uint(1000));
    const withdrawalPeriod = Cl.some(Cl.uint(100));
    const paramsCV = Cl.tuple({
      accountHolder,
      amount: withdrawalAmount,
      period: withdrawalPeriod,
    });
    const receipt = simnet.callPublicFn(
      contractAddress,
      "run",
      [Cl.buffer(Cl.serialize(paramsCV))],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ActionErrCode.ERR_UNAUTHORIZED));
  });
});
