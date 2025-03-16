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
const treasuryContractAddress = getContract(ContractType.DAO_TREASURY);

const voteSettings = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

const proposals = [
  getContract(ContractProposalType.DAO_ACTION_PROPOSALS_SET_PROPOSAL_BOND),
  getContract(ContractProposalType.DAO_BASE_ADD_NEW_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_DISABLE_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_ENABLE_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_REPLACE_EXTENSION),
  getContract(ContractProposalType.DAO_BASE_REPLACE_EXTENSION_PROPOSAL_VOTING),
  getContract(ContractProposalType.DAO_CORE_PROPOSALS_SET_PROPOSAL_BOND),
  getContract(ContractProposalType.DAO_ONCHAIN_MESSAGING_SEND),
  getContract(ContractProposalType.DAO_PAYMENTS_INVOICES_ADD_RESOURCE),
  getContract(ContractProposalType.DAO_PAYMENTS_INVOICES_PAY_INVOICE),
  getContract(
    ContractProposalType.DAO_PAYMENTS_INVOICES_PAY_INVOICE_BY_RESOURCE_NAME
  ),
  getContract(ContractProposalType.DAO_PAYMENTS_INVOICES_SET_PAYMENT_ADDRESS),
  getContract(ContractProposalType.DAO_PAYMENTS_INVOICES_TOGGLE_RESOURCE),
  getContract(
    ContractProposalType.DAO_PAYMENTS_INVOICES_TOGGLE_RESOURCE_BY_NAME
  ),
  getContract(ContractProposalType.DAO_TIMED_VAULT_DEPOSIT_STX),
  getContract(ContractProposalType.DAO_TIMED_VAULT_INITIALIZE_NEW_ACCOUNT),
  getContract(ContractProposalType.DAO_TIMED_VAULT_OVERRIDE_LAST_WITHDRAWAL),
  getContract(ContractProposalType.DAO_TIMED_VAULT_SET_ACCOUNT_HOLDER),
  getContract(ContractProposalType.DAO_TIMED_VAULT_SET_WITHDRAWAL_AMOUNT),
  getContract(ContractProposalType.DAO_TIMED_VAULT_SET_WITHDRAWAL_PERIOD),
  getContract(ContractProposalType.DAO_TOKEN_OWNER_SET_TOKEN_URI),
  getContract(ContractProposalType.DAO_TOKEN_OWNER_TRANSFER_OWNERSHIP),
  getContract(ContractProposalType.DAO_TREASURY_ALLOW_ASSET),
  getContract(ContractProposalType.DAO_TREASURY_DELEGATE_STX),
  getContract(ContractProposalType.DAO_TREASURY_DEPOSIT_FT),
  getContract(ContractProposalType.DAO_TREASURY_DEPOSIT_NFT),
  getContract(ContractProposalType.DAO_TREASURY_DEPOSIT_STX),
  getContract(ContractProposalType.DAO_TREASURY_FREEZE_ASSET),
  getContract(ContractProposalType.DAO_TREASURY_REVOKE_DELEGATION),
  getContract(ContractProposalType.DAO_TREASURY_WITHDRAW_FT),
  getContract(ContractProposalType.DAO_TREASURY_WITHDRAW_NFT),
  getContract(ContractProposalType.DAO_TREASURY_WITHDRAW_STX),
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
    // deposit STX to the treasury for proposal payments
    const treasuryReceipt = simnet.callPublicFn(
      treasuryContractAddress,
      "deposit-stx",
      [Cl.uint(1000000000)],
      deployer
    );
    expect(treasuryReceipt.result).toBeOk(Cl.bool(true));
    // act and assert
    proposals.forEach((proposal) => {
      dbgLog("=====================================");
      dbgLog(`Testing proposal: ${proposal}`);
      dbgLog(
        `Starting block heights: ${simnet.stacksBlockHeight} STX / ${simnet.burnBlockHeight} BTC`
      );
      if (
        proposal ===
        getContract(ContractProposalType.DAO_PAYMENTS_INVOICES_PAY_INVOICE)
      ) {
        dbgLog(simnet.getAssetsMap(), {
          titleBefore: "Assets map before passing proposal",
        });
      }
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
      dbgLog(simnet.getAssetsMap(), {
        titleBefore: "Assets map after passing proposal",
      });
      dbgLog(`receipt: ${JSON.stringify(receipt, null, 2)}`);
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
  });
});
