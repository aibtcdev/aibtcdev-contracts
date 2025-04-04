import {
  BooleanCV,
  BufferCV,
  PrincipalCV,
  TupleCV,
  UIntCV,
} from "@stacks/transactions";

export enum ContractType {
  // deployed before dao
  DAO_TOKEN = "aibtc-token",
  DAO_BITFLOW_POOL = "aibtc-bitflow-pool",
  DAO_TOKEN_PRE_DEX = "aibtc-pre-dex",
  DAO_TOKEN_DEX = "aibtc-token-dex",
  // base dao
  DAO_BASE = "aibtc-base-dao",
  // dao extensions
  DAO_ACTION_PROPOSALS = "aibtc-action-proposals",
  DAO_ACTION_PROPOSALS_V2 = "aibtc-action-proposals-v2",
  DAO_TIMED_VAULT_DAO = "aibtc-timed-vault-dao",
  DAO_TIMED_VAULT_SBTC = "aibtc-timed-vault-sbtc",
  DAO_TIMED_VAULT_STX = "aibtc-timed-vault-stx",
  DAO_CHARTER = "aibtc-dao-charter",
  DAO_CORE_PROPOSALS = "aibtc-core-proposals",
  DAO_CORE_PROPOSALS_V2 = "aibtc-core-proposals-v2",
  DAO_MESSAGING = "aibtc-onchain-messaging",
  DAO_PAYMENTS = "aibtc-payments-invoices",
  DAO_TOKEN_OWNER = "aibtc-token-owner",
  DAO_TREASURY = "aibtc-treasury",
}

export enum ContractActionType {
  // dao extension actions
  DAO_ACTION_ADD_RESOURCE = "aibtc-action-add-resource",
  DAO_ACTION_ALLOW_ASSET = "aibtc-action-treasury-allow-asset",
  DAO_ACTION_CONFIGURE_TIMED_VAULT_DAO = "aibtc-action-configure-timed-vault-dao",
  DAO_ACTION_CONFIGURE_TIMED_VAULT_SBTC = "aibtc-action-configure-timed-vault-sbtc",
  DAO_ACTION_CONFIGURE_TIMED_VAULT_STX = "aibtc-action-configure-timed-vault-stx",
  DAO_ACTION_SEND_MESSAGE = "aibtc-action-send-message",
  DAO_ACTION_TOGGLE_RESOURCE_BY_NAME = "aibtc-action-toggle-resource-by-name",
}

export enum ContractProposalType {
  // dao proposal templates
  DAO_ACTION_PROPOSALS_SET_PROPOSAL_BOND = "aibtc-action-proposals-set-proposal-bond",
  DAO_TIMED_VAULT_DAO_INITIALIZE_NEW_ACCOUNT = "aibtc-timed-vault-dao-initialize-new-vault",
  DAO_TIMED_VAULT_DAO_OVERRIDE_LAST_WITHDRAWAL_BLOCK = "aibtc-timed-vault-dao-override-last-withdrawal-block",
  DAO_TIMED_VAULT_DAO_SET_ACCOUNT_HOLDER = "aibtc-timed-vault-dao-set-account-holder",
  DAO_TIMED_VAULT_DAO_SET_WITHDRAWAL_AMOUNT = "aibtc-timed-vault-dao-set-withdrawal-amount",
  DAO_TIMED_VAULT_DAO_SET_WITHDRAWAL_PERIOD = "aibtc-timed-vault-dao-set-withdrawal-period",
  DAO_TIMED_VAULT_DAO_WITHDRAW = "aibtc-timed-vault-dao-withdraw",
  DAO_TIMED_VAULT_SBTC_INITIALIZE_NEW_ACCOUNT = "aibtc-timed-vault-sbtc-initialize-new-vault",
  DAO_TIMED_VAULT_SBTC_OVERRIDE_LAST_WITHDRAWAL_BLOCK = "aibtc-timed-vault-sbtc-override-last-withdrawal-block",
  DAO_TIMED_VAULT_SBTC_SET_ACCOUNT_HOLDER = "aibtc-timed-vault-sbtc-set-account-holder",
  DAO_TIMED_VAULT_SBTC_SET_WITHDRAWAL_AMOUNT = "aibtc-timed-vault-sbtc-set-withdrawal-amount",
  DAO_TIMED_VAULT_SBTC_SET_WITHDRAWAL_PERIOD = "aibtc-timed-vault-sbtc-set-withdrawal-period",
  DAO_TIMED_VAULT_SBTC_WITHDRAW = "aibtc-timed-vault-sbtc-withdraw",
  DAO_TIMED_VAULT_STX_INITIALIZE_NEW_ACCOUNT = "aibtc-timed-vault-stx-initialize-new-vault",
  DAO_TIMED_VAULT_STX_OVERRIDE_LAST_WITHDRAWAL_BLOCK = "aibtc-timed-vault-stx-override-last-withdrawal-block",
  DAO_TIMED_VAULT_STX_SET_ACCOUNT_HOLDER = "aibtc-timed-vault-stx-set-account-holder",
  DAO_TIMED_VAULT_STX_SET_WITHDRAWAL_AMOUNT = "aibtc-timed-vault-stx-set-withdrawal-amount",
  DAO_TIMED_VAULT_STX_SET_WITHDRAWAL_PERIOD = "aibtc-timed-vault-stx-set-withdrawal-period",
  DAO_TIMED_VAULT_STX_WITHDRAW = "aibtc-timed-vault-stx-withdraw",
  DAO_BASE_ADD_NEW_EXTENSION = "aibtc-base-add-new-extension",
  DAO_BASE_BOOTSTRAP_INITIALIZATION = "aibtc-base-bootstrap-initialization",
  DAO_BASE_BOOTSTRAP_INITIALIZATION_V2 = "aibtc-base-bootstrap-initialization-v2",
  DAO_BASE_DISABLE_EXTENSION = "aibtc-base-disable-extension",
  DAO_BASE_ENABLE_EXTENSION = "aibtc-base-enable-extension",
  DAO_BASE_REPLACE_EXTENSION = "aibtc-base-replace-extension",
  DAO_BASE_REPLACE_EXTENSION_PROPOSAL_VOTING = "aibtc-base-replace-extension-proposal-voting",
  DAO_CORE_PROPOSALS_SET_PROPOSAL_BOND = "aibtc-core-proposals-set-proposal-bond",
  DAO_ONCHAIN_MESSAGING_SEND = "aibtc-onchain-messaging-send",
  DAO_PAYMENTS_INVOICES_ADD_RESOURCE = "aibtc-payments-invoices-add-resource",
  DAO_PAYMENTS_INVOICES_SET_PAYMENT_ADDRESS = "aibtc-payments-invoices-set-payment-address",
  DAO_PAYMENTS_INVOICES_TOGGLE_RESOURCE_BY_NAME = "aibtc-payments-invoices-toggle-resource-by-name",
  DAO_PAYMENTS_INVOICES_TOGGLE_RESOURCE = "aibtc-payments-invoices-toggle-resource",
  DAO_TOKEN_OWNER_SET_TOKEN_URI = "aibtc-token-owner-set-token-uri",
  DAO_TOKEN_OWNER_TRANSFER_OWNERSHIP = "aibtc-token-owner-transfer-ownership",
  DAO_TREASURY_ALLOW_ASSET = "aibtc-treasury-allow-asset",
  DAO_TREASURY_DELEGATE_STX = "aibtc-treasury-delegate-stx",
  DAO_TREASURY_DISABLE_ASSET = "aibtc-treasury-disable-asset",
  DAO_TREASURY_REVOKE_DELEGATION = "aibtc-treasury-revoke-delegation",
  DAO_TREASURY_WITHDRAW_FT = "aibtc-treasury-withdraw-ft",
  DAO_TREASURY_WITHDRAW_NFT = "aibtc-treasury-withdraw-nft",
  DAO_TREASURY_WITHDRAW_STX = "aibtc-treasury-withdraw-stx",
}

type ContractExtensionNames = {
  [key in ContractType]: string;
};

type ContractActionNames = {
  [key in ContractActionType]: string;
};

export type ContractNames = ContractExtensionNames & ContractActionNames;

export enum TraitType {
  POOL = "xyk-pool-trait-v-1-2",
  DAO_BASE = "aibtcdev-dao-v1",
  DAO_TRAITS = "aibtcdev-dao-traits-v1",
  DAO_TRAITS_V1_1 = "aibtcdev-dao-traits-v1-1",
  DAO_BASE_V2 = "aibtcdev-dao-v2",
  DAO_TRAITS_V2 = "aibtcdev-dao-traits-v2",
  FAKTORY_TRAIT_V1 = "faktory-dex-trait-v1-1",
  SIP09 = "nft-trait",
  SIP10 = "sip-010-trait-ft-standard",
}

export type TraitNames = {
  [key in TraitType]: string;
};

export type VoteSettings = {
  votingDelay: number;
  votingPeriod: number;
  votingQuorum: number;
  votingThreshold: number;
  votingBond: number;
};

type VotableContracts =
  | ContractType.DAO_CORE_PROPOSALS
  | ContractType.DAO_CORE_PROPOSALS_V2
  | ContractType.DAO_ACTION_PROPOSALS
  | ContractType.DAO_ACTION_PROPOSALS_V2;

export type VotingConfig = {
  [key in VotableContracts]: VoteSettings;
};

export interface ActionProposalsV2ProposalData extends TupleCV {
  action: PrincipalCV;
  parameters: BufferCV;
  createdAt: UIntCV;
  caller: PrincipalCV;
  creator: PrincipalCV;
  startBlock: UIntCV;
  endBlock: UIntCV;
  votesFor: UIntCV;
  votesAgainst: UIntCV;
  liquidTokens: UIntCV;
  concluded: BooleanCV;
  metQuorum: BooleanCV;
  metThreshold: BooleanCV;
  passed: BooleanCV;
  executed: BooleanCV;
}

export interface ProposalsVotingConfiguration extends TupleCV {
  self: PrincipalCV;
  deployedBurnBlock: UIntCV;
  deployedStacksBlock: UIntCV;
  delay: UIntCV;
  period: UIntCV;
  quorum: UIntCV;
  threshold: UIntCV;
  tokenDex: PrincipalCV;
  tokenPool: PrincipalCV;
  treasury: PrincipalCV;
}
