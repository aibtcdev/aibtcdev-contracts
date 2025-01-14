import { Cl, cvToValue } from "@stacks/transactions";

export const actionProposalsContractName = "aibtc-action-proposals";
export const coreProposalsContractName = "aibtc-core-proposals";

export function getDaoTokens(deployer: string, address: string) {
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
  const totalSupply = cvToValue(getTotalSupplyReceipt.result);

  const getTreasuryBalanceReceipt = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-balance",
    [Cl.principal(treasuryContractAddress)],
    deployer
  );
  const treasuryBalance = cvToValue(getTreasuryBalanceReceipt.result);

  const getTokenDexBalanceReceipt = simnet.callReadOnlyFn(
    tokenContractAddress,
    "get-balance",
    [Cl.principal(tokenDexContractAddress)],
    deployer
  );
  const tokenDexBalance = cvToValue(getTokenDexBalanceReceipt.result);

  const liquidTokenSupply =
    parseInt(totalSupply.value) -
    parseInt(treasuryBalance.value) -
    parseInt(tokenDexBalance.value);

  console.log("BEFORE BUY");
  console.log("totalSupply", totalSupply);
  console.log("treasuryBalance", treasuryBalance);
  console.log("tokenDexBalance", tokenDexBalance);
  console.log("liquidTokenSupply", liquidTokenSupply);

  const getDaoTokensReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(tokenContractAddress), Cl.uint(1000000000)], // 1000 STX buy test
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

  const totalSupply2 = cvToValue(getTotalSupplyReceipt2.result);
  const treasuryBalance2 = cvToValue(getTreasuryBalanceReceipt2.result);
  const tokenDexBalance2 = cvToValue(getTokenDexBalanceReceipt2.result);

  const liquidTokenSupply2 =
    parseInt(totalSupply2.value) -
    parseInt(treasuryBalance2.value) -
    parseInt(tokenDexBalance2.value);

  console.log("AFTER BUY");
  console.log("totalSupply2", totalSupply2);
  console.log("treasuryBalance2", treasuryBalance2);
  console.log("tokenDexBalance2", tokenDexBalance2);
  console.log("liquidTokenSupply2", liquidTokenSupply2);

  const addressBalance = cvToValue(addressBalanceReceipt.result);
  const addressVotingPower =
    parseInt(addressBalance.value) / parseInt(totalSupply2.value);

  console.log("ADDRESS INFO");
  console.log("addressBalance", addressBalance);
  console.log("addressBalance voting power", addressVotingPower);

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
