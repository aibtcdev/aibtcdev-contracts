import { describe, expect, it } from "vitest";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../dao-types";
import { VOTING_CONFIG } from "../../test-utilities";
import { DaoCharterErrCode } from "../../error-codes";
import { Cl } from "@stacks/transactions";

// general account definitions
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
// helper for contract name definitions
const getContract = (
  contractType: ContractType | ContractProposalType | ContractActionType
): string => `${deployer}.${contractType}`;
// general contract name definitons
const coreProposalsV2ContractAddress = getContract(
  ContractType.DAO_CORE_PROPOSALS_V2
);
const coreProposalContactAddress = getContract(
  ContractProposalType.DAO_ONCHAIN_MESSAGING_SEND
);
const tokenContractAddress = getContract(ContractType.DAO_TOKEN);
const tokenDexContractAddress = getContract(ContractType.DAO_TOKEN_DEX);
const baseDaoContractAddress = getContract(ContractType.DAO_BASE);
const bootstrapContractAddress = getContract(
  ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
);
// general vote settings configurations
const coreProposalV2VoteSettings =
  VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];
// import contract error codes
const ErrCode = DaoCharterErrCode;

describe(`public functions: ${ContractType.DAO_CHARTER}`, () => {
  ////////////////////////////////////////
  // callback() tests
  ////////////////////////////////////////

  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });
});
