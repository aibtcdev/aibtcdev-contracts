import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { CoreProposalV2ErrCode } from "../../error-codes";
import {
  constructDao,
  fundVoters,
  passCoreProposal,
  VOTING_CONFIG,
} from "../../test-utilities";
import {
  ContractActionType,
  ContractProposalType,
  ContractType,
} from "../../dao-types";

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
const ErrCode = CoreProposalV2ErrCode;

describe(`public functions: ${ContractType.DAO_CORE_PROPOSALS_V2}`, () => {
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

  ////////////////////////////////////////
  // create-proposal() tests
  ////////////////////////////////////////

  it("create-proposal() fails if the liquid tokens are 0", () => {
    const receipt = simnet.callPublicFn(
      coreProposalsV2ContractAddress,
      "propose-action",
      [Cl.principal(coreProposalContactAddress)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_FETCHING_TOKEN_DATA));
  });

  ////////////////////////////////////////
  // vote-on-proposal() tests
  ////////////////////////////////////////

  ////////////////////////////////////////
  // conclude-proposal() tests
  ////////////////////////////////////////
});

describe(`read-only functions: ${ContractType.DAO_CORE_PROPOSALS_V2}`, () => {
  ////////////////////////////////////////
  // get-voting-power() tests
  ////////////////////////////////////////
  it("get-voting-power(): fails if proposal is not found", () => {
    const invalidProposal = getContract(
      ContractProposalType.DAO_TREASURY_ALLOW_ASSET
    );
    const receipt = simnet.callReadOnlyFn(
      coreProposalsV2ContractAddress,
      "get-voting-power",
      [Cl.principal(deployer), Cl.principal(invalidProposal)],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });
  ////////////////////////////////////////
  // get-proposal() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // get-vote-record() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // get-total-proposals() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // get-last-proposal-created() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // get-voting-configuration() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // get-liquid-supply() tests
  ////////////////////////////////////////
});
