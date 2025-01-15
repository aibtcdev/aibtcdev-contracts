import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export const actionProposalsContractName = "aibtc-action-proposals";
export const coreProposalsContractName = "aibtc-core-proposals";
const votingPeriod = 144; // 24 hours

function getPercentageOfSupply(amount: number, totalSupply: number) {
  const rawPercentage = (amount / totalSupply) * 100;
  const percentage = rawPercentage.toFixed(2);
  return percentage;
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
    [Cl.principal(tokenContractAddress), Cl.uint(stxAmount)], // 1000 STX buy test
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
    console.log(`voteReceipt: ${voter}`);
    console.log(voteReceipt.result);
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
  sender: string
) {
  // propose-action
  // vote-on-proposal
  // conclude-propsal
}
