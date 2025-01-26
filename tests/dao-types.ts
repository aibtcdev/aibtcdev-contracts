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
  DAO_TOKEN_DEX = "aibtc-token-dex",
  // base dao
  DAO_BASE = "aibtcdev-base-dao",
  // dao extensions
  DAO_ACTION_PROPOSALS = "aibtc-action-proposals",
  DAO_ACTION_PROPOSALS_V2 = "aibtc-action-proposals-v2",
  DAO_BANK_ACCOUNT = "aibtc-bank-account",
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
  DAO_ACTION_ALLOW_ASSET = "aibtc-action-allow-asset",
  DAO_ACTION_SEND_MESSAGE = "aibtc-action-send-message",
  DAO_ACTION_SET_ACCOUNT_HOLDER = "aibtc-action-set-account-holder",
  DAO_ACTION_SET_WITHDRAWAL_AMOUNT = "aibtc-action-set-withdrawal-amount",
  DAO_ACTION_SET_WITHDRAWAL_PERIOD = "aibtc-action-set-withdrawal-period",
  DAO_ACTION_TOGGLE_RESOURCE_BY_NAME = "aibtc-action-toggle-resource-by-name",
}

export enum ContractProposalType {
  // dao proposal templates
  DAO_BANK_ACCOUNT_DEPOSIT_STX = "aibtc-bank-account-deposit-stx",
  DAO_BANK_ACCOUNT_INITIALIZE_NEW_ACCOUNT = "aibtc-bank-account-initialize-new-account",
  DAO_BANK_ACCOUNT_OVERRIDE_LAST_WITHDRAWAL = "aibtc-bank-account-override-last-withdrawal",
  DAO_BANK_ACCOUNT_SET_ACCOUNT_HOLDER = "aibtc-bank-account-set-account-holder",
  DAO_BANK_ACCOUNT_SET_WITHDRAWAL_AMOUNT = "aibtc-bank-account-set-withdrawal-amount",
  DAO_BANK_ACCOUNT_SET_WITHDRAWAL_PERIOD = "aibtc-bank-account-set-withdrawal-period",
  DAO_BANK_ACCOUNT_WITHDRAW_STX = "aibtc-bank-account-withdraw-stx",
  DAO_BASE_ADD_NEW_EXTENSION = "aibtc-base-add-new-extension",
  DAO_BASE_BOOTSTRAP_INITIALIZATION = "aibtc-base-bootstrap-initialization",
  DAO_BASE_BOOTSTRAP_INITIALIZATION_V2 = "aibtc-base-bootstrap-initialization-v2",
  DAO_BASE_DISABLE_EXTENSION = "aibtc-base-disable-extension",
  DAO_BASE_ENABLE_EXTENSION = "aibtc-base-enable-extension",
  DAO_BASE_REPLACE_EXTENSION = "aibtc-base-replace-extension",
  DAO_BASE_REPLACE_EXTENSION_PROPOSAL_VOTING = "aibtc-base-replace-extension-proposal-voting",
  DAO_ONCHAIN_MESSAGING_SEND = "aibtc-onchain-messaging-send",
  DAO_PAYMENTS_INVOICES_ADD_RESOURCE = "aibtc-payments-invoices-add-resource",
  DAO_PAYMENTS_INVOICES_PAY_INVOICE_BY_RESOURCE_NAME = "aibtc-payments-invoices-pay-invoice-by-resource-name",
  DAO_PAYMENTS_INVOICES_PAY_INVOICE = "aibtc-payments-invoices-pay-invoice",
  DAO_PAYMENTS_INVOICES_SET_PAYMENT_ADDRESS = "aibtc-payments-invoices-set-payment-address",
  DAO_PAYMENTS_INVOICES_TOGGLE_RESOURCE_BY_NAME = "aibtc-payments-invoices-toggle-resource-by-name",
  DAO_PAYMENTS_INVOICES_TOGGLE_RESOURCE = "aibtc-payments-invoices-toggle-resource",
  DAO_TOKEN_OWNER_SET_TOKEN_URI = "aibtc-token-owner-set-token-uri",
  DAO_TOKEN_OWNER_TRANSFER_OWNERSHIP = "aibtc-token-owner-transfer-ownership",
  DAO_TREASURY_ALLOW_ASSET = "aibtc-treasury-allow-asset",
  DAO_TREASURY_DELEGATE_STX = "aibtc-treasury-delegate-stx",
  DAO_TREASURY_DEPOSIT_FT = "aibtc-treasury-deposit-ft",
  DAO_TREASURY_DEPOSIT_NFT = "aibtc-treasury-deposit-nft",
  DAO_TREASURY_DEPOSIT_STX = "aibtc-treasury-deposit-stx",
  DAO_TREASURY_FREEZE_ASSET = "aibtc-treasury-freeze-asset",
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
