import { Cl, ClarityValue } from "@stacks/transactions";
import { expect } from "vitest";
import { ContractActionType, ContractNames, ContractType } from "./dao-types";

const votingPeriod = 144; // 24 hours

// voting configuration
export const VOTING_CONFIG = {
  [ContractType.DAO_CORE_PROPOSALS]: {
    votingDelay: 144, // 144 Bitcoin blocks (~3 days)
    votingPeriod: 144, // 144 Bitcoin blocks (~3 days)
    votingQuorum: 95, // 95% of liquid supply must participate
    votingThreshold: 95, // 95% of votes must be in favor
  },
  [ContractType.DAO_CORE_PROPOSALS_V2]: {
    votingDelay: 432, // 3 x 144 Bitcoin blocks (~3 days)
    votingPeriod: 432, // 3 x 144 Bitcoin blocks (~3 days)
    votingQuorum: 25, // 25% of liquid supply must participate
    votingThreshold: 90, // 90% of votes must be in favor
  },
};

export function generateContractNames(tokenSymbol: string): ContractNames {
  return {
    [ContractType.DAO_TOKEN]: `${tokenSymbol.toLowerCase()}-faktory`,
    [ContractType.DAO_BITFLOW_POOL]: `xyk-pool-stx-${tokenSymbol.toLowerCase()}-v-1-1`,
    [ContractType.DAO_TOKEN_DEX]: `${tokenSymbol.toLowerCase()}-faktory-dex`,
    [ContractType.DAO_TOKEN_OWNER]: `${tokenSymbol.toLowerCase()}-token-owner`,
    [ContractType.DAO_BASE]: `${tokenSymbol.toLowerCase()}-base-dao`,
    [ContractType.DAO_ACTION_PROPOSALS]: `${tokenSymbol.toLowerCase()}-action-proposals`,
    [ContractType.DAO_ACTION_PROPOSALS_V2]: `${tokenSymbol.toLowerCase()}-action-proposals-v2`,
    [ContractType.DAO_BANK_ACCOUNT]: `${tokenSymbol.toLowerCase()}-bank-account`,
    [ContractType.DAO_CORE_PROPOSALS]: `${tokenSymbol.toLowerCase()}-core-proposals`,
    [ContractType.DAO_CORE_PROPOSALS_V2]: `${tokenSymbol.toLowerCase()}-core-proposals-v2`,
    [ContractType.DAO_MESSAGING]: `${tokenSymbol.toLowerCase()}-onchain-messaging`,
    [ContractType.DAO_PAYMENTS]: `${tokenSymbol.toLowerCase()}-payments-invoices`,
    [ContractType.DAO_TREASURY]: `${tokenSymbol.toLowerCase()}-treasury`,
    [ContractType.DAO_PROPOSAL_BOOTSTRAP]: `${tokenSymbol.toLowerCase()}-base-bootstrap-initialization`,
    [ContractType.DAO_PROPOSAL_BOOTSTRAP_V2]: `${tokenSymbol.toLowerCase()}-base-bootstrap-initialization-v2`,
    [ContractActionType.DAO_ACTION_ADD_RESOURCE]: `${tokenSymbol.toLowerCase()}-action-add-resource`,
    [ContractActionType.DAO_ACTION_ALLOW_ASSET]: `${tokenSymbol.toLowerCase()}-action-allow-asset`,
    [ContractActionType.DAO_ACTION_SEND_MESSAGE]: `${tokenSymbol.toLowerCase()}-action-send-message`,
    [ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER]: `${tokenSymbol.toLowerCase()}-action-set-account-holder`,
    [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_AMOUNT]: `${tokenSymbol.toLowerCase()}-action-set-withdrawal-amount`,
    [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_PERIOD]: `${tokenSymbol.toLowerCase()}-action-set-withdrawal-period`,
    [ContractActionType.DAO_ACTION_TOGGLE_RESOURCE]: `${tokenSymbol.toLowerCase()}-action-toggle-resource`,
  };
}

export function getDaoTokens(
  tokenContractAddress: string,
  tokenDexContractAddress: string,
  address: string,
  stxAmount: number
) {
  const getDaoTokensReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(tokenContractAddress), Cl.uint(stxAmount)],
    address
  );

  return getDaoTokensReceipt;
}

export function fundVoters(
  tokenContractAddress: string,
  tokenDexContractAddress: string,
  voters: string[]
) {
  for (const voter of voters) {
    const stxAmount = Math.floor(Math.random() * 500000000) + 1000000;
    const getDaoTokensReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      voter,
      stxAmount
    );
    expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));
  }
}

export function constructDao(
  deployer: string,
  bootstrapContractAddress: string
) {
  const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
  const constructDaoReceipt = simnet.callPublicFn(
    baseDaoContractAddress,
    "construct",
    [Cl.principal(bootstrapContractAddress)],
    deployer
  );

  return constructDaoReceipt;
}

export function passCoreProposal(
  coreProposalsContractName: string,
  proposalContractAddress: string,
  deployer: string,
  voters: string[],
  votingPeriod: number
) {
  // create-proposal
  const createProposalReceipt = simnet.callPublicFn(
    `${deployer}.${coreProposalsContractName}`,
    "create-proposal",
    [Cl.principal(proposalContractAddress)],
    deployer
  );
  expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
  // vote-on-proposal
  for (const voter of voters) {
    const voteReceipt = simnet.callPublicFn(
      `${deployer}.${coreProposalsContractName}`,
      "vote-on-proposal",
      [Cl.principal(proposalContractAddress), Cl.bool(true)],
      voter
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
  }
  // progress past the end block (and v2 delay)
  simnet.mineEmptyBlocks(votingPeriod);
  // conclude-proposal
  const concludeProposalReceipt = simnet.callPublicFn(
    `${deployer}.${coreProposalsContractName}`,
    "conclude-proposal",
    [Cl.principal(proposalContractAddress)],
    deployer
  );
  // return final receipt for processing
  return concludeProposalReceipt;
}

export function passActionProposal(
  actionProposalsContractAddress: string,
  proposalContractAddress: string,
  proposalId: number,
  proposalParams: ClarityValue,
  deployer: string,
  sender: string,
  voters: string[]
) {
  // propose-action
  const proposeActionReceipt = simnet.callPublicFn(
    actionProposalsContractAddress,
    "propose-action",
    [
      Cl.principal(proposalContractAddress),
      Cl.buffer(Cl.serialize(proposalParams)),
    ],
    sender
  );
  //console.log("proposeActionReceipt");
  //console.log(proposeActionReceipt);
  expect(proposeActionReceipt.result).toBeOk(Cl.bool(true));
  // vote-on-proposal
  for (const voter of voters) {
    const voteReceipt = simnet.callPublicFn(
      actionProposalsContractAddress,
      "vote-on-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      voter
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
  }
  // progress past the end block
  simnet.mineEmptyBlocks(votingPeriod);
  // conclude-proposal
  const concludeProposalReceipt = simnet.callPublicFn(
    actionProposalsContractAddress,
    "conclude-proposal",
    [Cl.uint(proposalId), Cl.principal(proposalContractAddress)],
    deployer
  );
  // return final receipt for processing
  return concludeProposalReceipt;
}
