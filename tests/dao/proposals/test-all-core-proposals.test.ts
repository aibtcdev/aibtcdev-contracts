import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  constructDao,
  dbgLog,
  getDaoTokens,
  passCoreProposal,
  SBTC_CONTRACT,
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
const oldBootstrapContractAddress = getContract(
  ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION
);
const bootstrapContractAddress = getContract(
  ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
);
const coreProposalsV2ContractAddress = getContract(
  ContractType.DAO_CORE_PROPOSALS_V2
);
const tokenContractAddress = getContract(ContractType.DAO_TOKEN);
const tokenDexContractAddress = getContract(ContractType.DAO_TOKEN_DEX);
const treasuryContractAddress = getContract(ContractType.DAO_TREASURY);
const timedVaultStxContractAddress = getContract(
  ContractType.DAO_TIMED_VAULT_STX
);
const timedVaultSbtcContractAddress = getContract(
  ContractType.DAO_TIMED_VAULT_SBTC
);
const timedVaultDaoContractAddress = getContract(
  ContractType.DAO_TIMED_VAULT_DAO
);

const voteSettings = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

// create an array of all the proposals
const proposals = Object.values(ContractProposalType).map((proposal) =>
  getContract(proposal)
);

describe("Core proposal testing: all contracts", () => {
  it("should pass all core proposals", () => {
    // arrange
    const amountDao = 10000000000000; // 100,000 dao tokens (8 decimals)
    const sbtcSpend = 400000; // used to buy dao tokens from dex
    const amountStx = 1000000000; // 1,000 STX (6 decimals)
    // construct the dao
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));
    // get sbtc to transfer to the treasury and vault
    const sbtcReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(sbtcReceipt.result).toBeOk(Cl.bool(true));
    // get dao tokens to transfer to the treasury, vault, and to vote
    const dexReceipt = getDaoTokens(
      tokenContractAddress,
      tokenDexContractAddress,
      deployer,
      sbtcSpend
    );
    expect(dexReceipt.result).toBeOk(Cl.bool(true));
    // transfer dao tokens to the treasury
    const daoTransferReceipt = simnet.callPublicFn(
      tokenContractAddress,
      "transfer",
      [
        Cl.uint(amountDao),
        Cl.principal(deployer),
        Cl.principal(treasuryContractAddress),
        Cl.none(),
      ],
      deployer
    );
    expect(daoTransferReceipt.result).toBeOk(Cl.bool(true));
    // transfer sbtc to the treasury
    const sbtcTransferReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "transfer",
      [
        Cl.uint(sbtcSpend),
        Cl.principal(deployer),
        Cl.principal(treasuryContractAddress),
        Cl.none(),
      ],
      deployer
    );
    expect(sbtcTransferReceipt.result).toBeOk(Cl.bool(true));
    // transfer stx to the treasury
    const stxTransferReceipt = simnet.callPublicFn(
      treasuryContractAddress,
      "deposit-stx",
      [Cl.uint(amountStx)],
      deployer
    );
    expect(stxTransferReceipt.result).toBeOk(Cl.bool(true));
    // transfer stx to the stx vault
    const stxVaultTransferReceipt = simnet.callPublicFn(
      timedVaultStxContractAddress,
      "deposit",
      [Cl.uint(amountStx)],
      deployer
    );
    expect(stxVaultTransferReceipt.result).toBeOk(Cl.bool(true));
    // transfer sbtc to the sbtc vault
    const sbtcVaultTransferReceipt = simnet.callPublicFn(
      timedVaultSbtcContractAddress,
      "deposit",
      [Cl.uint(sbtcSpend)],
      deployer
    );
    expect(sbtcVaultTransferReceipt.result).toBeOk(Cl.bool(true));
    // transfer dao tokens to the dao vault
    const daoVaultTransferReceipt = simnet.callPublicFn(
      timedVaultDaoContractAddress,
      "deposit",
      [Cl.uint(amountDao)],
      deployer
    );
    expect(daoVaultTransferReceipt.result).toBeOk(Cl.bool(true));
    // mint nft to the treasury
    const nftId = 1;
    const mintNftReceipt = simnet.callPublicFn(
      `${deployer}.aibtcdev-airdrop-1`,
      "mint",
      [Cl.principal(treasuryContractAddress)],
      deployer
    );
    expect(mintNftReceipt.result).toBeOk(Cl.bool(true));
    // output assets map for debugging
    const assetsMap = simnet.getAssetsMap();
    for (const [key, value] of assetsMap) {
      for (const [innerKey, innerValue] of value) {
        dbgLog(`assetsMap[${key}]: ${innerKey}: ${innerValue}`);
      }
    }
    // act and assert
    proposals.forEach((proposal) => {
      // skip the bootstrap proposals
      if (
        proposal === oldBootstrapContractAddress ||
        proposal === bootstrapContractAddress
      ) {
        return;
      }
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
