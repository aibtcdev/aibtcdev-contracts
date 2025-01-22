import { Cl, ClarityValue, cvToValue } from "@stacks/transactions";
import { expect } from "vitest";

export const actionProposalsContractName = "aibtc-action-proposals";
export const coreProposalsContractName = "aibtc-core-proposals";
const votingPeriod = 144; // 24 hours

function getPercentageOfSupply(amount: number, totalSupply: number) {
  const rawPercentage = (amount / totalSupply) * 100;
  const percentage = rawPercentage.toFixed(2);
  return percentage;
}

export function fundVoters(deployer: string, voters: string[]) {
  for (const voter of voters) {
    const stxAmount = Math.floor(Math.random() * 500000000) + 1000000;
    const getDaoTokensReceipt = getDaoTokens(deployer, voter, stxAmount);
    expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));
  }
}

export function getDaoTokens(
  deployer: string,
  address: string,
  stxAmount: number
) {
  const tokenContractName = "aibtc-token";
  const tokenContractAddress = `${deployer}.${tokenContractName}`;
  const tokenDexContractName = "aibtc-token-dex";
  const tokenDexContractAddress = `${deployer}.${tokenDexContractName}`;

  const getDaoTokensReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(tokenContractAddress), Cl.uint(stxAmount)],
    address
  );

  return getDaoTokensReceipt;
}

export function constructDao(deployer: string) {
  const baseDaoContractName = "aibtcdev-base-dao";
  const baseDaoContractAddress = `${deployer}.${baseDaoContractName}`;
  const bootstrapContractName = "aibtc-base-bootstrap-initialization";
  const bootstrapContractAddress = `${deployer}.${bootstrapContractName}`;

  const constructDaoReceipt = simnet.callPublicFn(
    baseDaoContractAddress,
    "construct",
    [Cl.principal(bootstrapContractAddress)],
    deployer
  );

  return constructDaoReceipt;
}

export function passCoreProposal(
  proposalContractAddress: string,
  deployer: string,
  voters: string[]
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
  // progress past the end block
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
  proposalContractAddress: string,
  proposalParams: ClarityValue,
  deployer: string,
  sender: string,
  voters: string[]
) {
  // TODO: hardcoded
  const proposalId = 1;
  // propose-action
  const proposeActionReceipt = simnet.callPublicFn(
    `${deployer}.${actionProposalsContractName}`,
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
      `${deployer}.${actionProposalsContractName}`,
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
    `${deployer}.${actionProposalsContractName}`,
    "conclude-proposal",
    [Cl.uint(proposalId), Cl.principal(proposalContractAddress)],
    deployer
  );
  // return final receipt for processing
  return concludeProposalReceipt;
}
