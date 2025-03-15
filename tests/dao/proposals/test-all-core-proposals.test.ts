import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  constructDao,
  dbgLog,
  getDaoTokens,
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
// helper for contract name definitions
const getContract = (
  contractType: ContractType | ContractProposalType | ContractActionType
): string => `${deployer}.${contractType}`;

const baseDaoContractAddress = getContract(ContractType.DAO_BASE);
const bootstrapContractAddress = getContract(
  ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
);
const coreProposalsV2ContractAddress = getContract(
  ContractType.DAO_CORE_PROPOSALS_V2
);
const tokenContractAddress = getContract(ContractType.DAO_TOKEN);
const tokenDexContractAddress = getContract(ContractType.DAO_TOKEN_DEX);

const voteSettings = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

const proposals = [
  getContract(ContractProposalType.DAO_ACTION_PROPOSALS_SET_PROPOSAL_BOND),
  getContract(ContractProposalType.DAO_BASE_ADD_NEW_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_DISABLE_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_ENABLE_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_REPLACE_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_REPLACE_EXTENSION_PROPOSAL_VOTING),
  getContract(ContractProposalType.DAO_CORE_PROPOSALS_SET_PROPOSAL_BOND),
];

describe("Core proposal testing: all contracts", () => {
  it("should pass all core proposals", () => {
    // arrange
    // construct the dao
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    // get the dao tokens so we can propose
    const dexReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      1000000
    );
    expect(dexReceipt.result).toBeOk(Cl.bool(true));
    // act and assert
    proposals.forEach((proposal) => {
      dbgLog("=====================================");
      dbgLog(`Testing proposal: ${proposal}`);
      dbgLog(
        `Starting block heights: ${simnet.stacksBlockHeight} STX / ${simnet.burnBlockHeight} BTC`
      );
      const receipt = passCoreProposal(
        coreProposalsV2ContractAddress,
        proposal,
        deployer,
        [deployer],
        voteSettings
      );
      dbgLog(
        `Ending block heights: ${simnet.stacksBlockHeight} STX / ${simnet.burnBlockHeight} BTC`
      );
      dbgLog(`receipt: ${JSON.stringify(receipt, null, 2)}`);
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
  });
});
