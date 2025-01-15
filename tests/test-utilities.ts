import { Cl, cvToValue } from "@stacks/transactions";

export const actionProposalsContractName = "aibtc-action-proposals";
export const coreProposalsContractName = "aibtc-core-proposals";

function getPercentageOfSupply(amount: number, totalSupply: number) {
  const rawPercentage = (amount / totalSupply) * 100;
  const percentage = rawPercentage.toFixed(2);
  return `${percentage}% supply`;
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
  const tokenTreasuryContractName = "aibtc-treasury";
  const treasuryContractAddress = `${deployer}.${tokenTreasuryContractName}`;

  const getTotalSupplyReceipt = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-total-supply",
    [],
    deployer
  );
  const totalSupply = parseInt(cvToValue(getTotalSupplyReceipt.result).value);

  const getTreasuryBalanceReceipt = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-balance",
    [Cl.principal(treasuryContractAddress)],
    deployer
  );
  const treasuryBalance = parseInt(
    cvToValue(getTreasuryBalanceReceipt.result).value
  );

  const getTokenDexBalanceReceipt = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-balance",
    [Cl.principal(tokenDexContractAddress)],
    deployer
  );
  const tokenDexBalance = parseInt(
    cvToValue(getTokenDexBalanceReceipt.result).value
  );

  const liquidTokenSupply = totalSupply - treasuryBalance - tokenDexBalance;

  console.log("=========================");
  console.log("BEFORE BUY");
  console.log("totalSupply", totalSupply);
  console.log(
    "treasuryBalance",
    treasuryBalance,
    getPercentageOfSupply(treasuryBalance, totalSupply)
  );
  console.log(
    "tokenDexBalance",
    tokenDexBalance,
    getPercentageOfSupply(tokenDexBalance, totalSupply)
  );
  console.log(
    "liquidTokenSupply",
    liquidTokenSupply,
    getPercentageOfSupply(liquidTokenSupply, totalSupply)
  );

  const getDaoTokensReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(tokenContractAddress), Cl.uint(stxAmount)], // 1000 STX buy test
    address
  );

  const getTreasuryBalanceReceipt2 = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-balance",
    [Cl.principal(treasuryContractAddress)],
    deployer
  );

  const getTokenDexBalanceReceipt2 = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-balance",
    [Cl.principal(tokenDexContractAddress)],
    deployer
  );

  const getTotalSupplyReceipt2 = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-total-supply",
    [],
    deployer
  );

  const addressBalanceReceipt = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-balance",
    [Cl.principal(address)],
    deployer
  );

  const totalSupply2 = parseInt(cvToValue(getTotalSupplyReceipt2.result).value);
  const treasuryBalance2 = parseInt(
    cvToValue(getTreasuryBalanceReceipt2.result).value
  );
  const tokenDexBalance2 = parseInt(
    cvToValue(getTokenDexBalanceReceipt2.result).value
  );

  const liquidTokenSupply2 = totalSupply2 - treasuryBalance2 - tokenDexBalance2;

  console.log("=========================");
  console.log("AFTER BUY");
  console.log("totalSupply2", totalSupply2);
  console.log(
    "treasuryBalance2",
    treasuryBalance2,
    getPercentageOfSupply(treasuryBalance2, totalSupply2)
  );
  console.log(
    "tokenDexBalance2",
    tokenDexBalance2,
    getPercentageOfSupply(tokenDexBalance2, totalSupply2)
  );
  console.log(
    "liquidTokenSupply2",
    liquidTokenSupply2,
    getPercentageOfSupply(liquidTokenSupply2, totalSupply2)
  );

  const addressBalance = parseInt(
    cvToValue(addressBalanceReceipt.result).value
  );
  const addressVotingPower = addressBalance / liquidTokenSupply2;

  console.log("=========================");
  console.log("ADDRESS INFO");
  console.log(
    "addressBalance",
    addressBalance,
    getPercentageOfSupply(addressBalance, totalSupply2)
  );
  console.log(
    "addressBalance voting power calculated",
    addressVotingPower,
    getPercentageOfSupply(addressBalance, liquidTokenSupply2)
  );

  /*
  ;; if VOTING_QUORUM <= ((votesFor * 100) / liquidTokens)
  (votePassed (<= VOTING_QUORUM (/ (* (get votesFor proposalRecord) u100) (get liquidTokens proposalRecord))))
  */

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
  deployer: string
  // voters: string[]
) {
  // create-proposal
  const createProposalReceipt = simnet.callPublicFn(
    `${deployer}.${coreProposalsContractName}`,
    "create-proposal",
    [Cl.principal(proposalContractAddress)],
    deployer
  );
  // temporary
  return createProposalReceipt;
  // vote-on-proposal
  // conclude-proposal
}

export function passActionProposal(
  proposalContractAddress: string,
  sender: string
) {
  // propose-action
  // vote-on-proposal
  // conclude-propsal
}
