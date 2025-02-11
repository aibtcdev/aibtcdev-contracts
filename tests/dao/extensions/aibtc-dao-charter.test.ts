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
const charterContractAddress = getContract(ContractType.DAO_CHARTER);
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
  ////////////////////////////////////////
  // activate-dao-charter() tests
  ////////////////////////////////////////
  it("vote-to-activate() succeeds and logs a new vote record", () => {
    const activateDaoCharter = simnet.callPublicFn(
      charterContractAddress,
      "vote-to-activate",
      [],
      deployer
    );
    expect(activateDaoCharter.result).toBeOk(Cl.bool(true));
  });
  ////////////////////////////////////////
  // set-dao-charter() tests
  //////////////////////////////////
  it("set-dao-charter() fails if dao is not activated", () => {
    const setDaoCharter = simnet.callPublicFn(
      charterContractAddress,
      "set-dao-charter",
      [Cl.stringAscii("test"), Cl.none()],
      deployer
    );
    expect(setDaoCharter.result).toBeErr(
      Cl.uint(ErrCode.ERR_DAO_NOT_ACTIVATED)
    );
  });
});

describe(`read-only functions: ${ContractType.DAO_CHARTER}`, () => {
  ////////////////////////////////////////
  // is-dao-activated() tests
  ////////////////////////////////////////
  it("is-dao-activated() returns activated: false before activation", () => {
    const isDaoActivated = simnet.callReadOnlyFn(
      charterContractAddress,
      "is-dao-activated",
      [],
      deployer
    );
    const expectedResult = Cl.tuple({
      activated: Cl.bool(false),
      dao: Cl.principal(charterContractAddress),
      votes: Cl.uint(0),
    });
    expect(isDaoActivated.result).toStrictEqual(expectedResult);
  });
  ////////////////////////////////////////
  // get-activation-vote-record() tests
  ////////////////////////////////////////
  it("get-activation-vote-record() returns none when user is not found", () => {
    const getActivationVoteRecord = simnet.callReadOnlyFn(
      charterContractAddress,
      "get-activation-vote-record",
      [Cl.principal(address1)],
      deployer
    );
    expect(getActivationVoteRecord.result).toBeNone();
  });
  ////////////////////////////////////////
  // get-current-dao-charter-version() tests
  ////////////////////////////////////////
  it("get-current-dao-charter-version() returns none before activation", () => {
    const getCurrentDaoCharterVersion = simnet.callReadOnlyFn(
      charterContractAddress,
      "get-current-dao-charter-version",
      [],
      deployer
    );
    expect(getCurrentDaoCharterVersion.result).toBeNone();
  });
  ////////////////////////////////////////
  // get-current-dao-charter() tests
  ////////////////////////////////////////
  it("get-current-dao-charter() returns none before activation", () => {
    const getCurrentDaoCharter = simnet.callReadOnlyFn(
      charterContractAddress,
      "get-current-dao-charter",
      [],
      deployer
    );
    expect(getCurrentDaoCharter.result).toBeNone();
  });
  ////////////////////////////////////////
  // get-dao-charter() tests
  ////////////////////////////////////////
  it("get-dao-charter() returns none before activation", () => {
    const getDaoCharter = simnet.callReadOnlyFn(
      charterContractAddress,
      "get-dao-charter",
      [Cl.uint(1)],
      deployer
    );
    expect(getDaoCharter.result).toBeNone();
  });
});
