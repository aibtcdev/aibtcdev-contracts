import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach, beforeAll } from "vitest";
import { UserAgentVaultErrCode } from "./error-codes";
import {
  constructDao,
  convertSIP019PrintEvent,
  fundVoters,
  getDaoTokens,
  VOTING_CONFIG,
} from "./test-utilities";
import { ClarityEvent } from "@hirosystems/clarinet-sdk";

// Define constants and accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const address2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const address3 = accounts.get("wallet_3")!;

// Contract references
const contractName = "aibtc-user-agent-vault";
const contractAddress = `${deployer}.${contractName}`;
const sbtcDeployer = "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2";
const sbtcTokenAddress = `${sbtcDeployer}.sbtc-token`;
const daoTokenAddress = `${deployer}.aibtc-token`;
const tokenDexContractAddress = `${deployer}.aibtc-token-dex`;
const baseDaoContractAddress = `${deployer}.aibtc-base-dao`;
const bootstrapContractAddress = `${deployer}.aibtc-base-bootstrap-initialization-v2`;
const actionProposalsV2ContractAddress = `${deployer}.aibtc-action-proposals-v2`;
const sendMessageActionContractAddress = `${deployer}.aibtc-action-send-message`;
const coreProposalsV2ContractAddress = `${deployer}.aibtc-core-proposals-v2`;
const baseEnableExtensionContractAddress = `${deployer}.aibtc-base-enable-extension`;

// Voting config
const actionProposalVotingConfig = VOTING_CONFIG["aibtc-action-proposals-v2"];
const coreProposalVotingConfig = VOTING_CONFIG["aibtc-core-proposals-v2"];

// Error codes
const ErrCode = UserAgentVaultErrCode;

function setupVault(sender: string) {
  // construct the dao
  const constructReceipt = constructDao(
    sender,
    baseDaoContractAddress,
    bootstrapContractAddress
  );
  expect(constructReceipt.result).toBeOk(Cl.bool(true));
  // get sbtc from the faucet
  const faucetReceipt = simnet.callPublicFn(
    sbtcTokenAddress,
    "faucet",
    [],
    sender
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));
  // get dao tokens from the dex
  const dexReceipt = getDaoTokens(
    daoTokenAddress,
    tokenDexContractAddress,
    sender,
    1000
  );
  expect(dexReceipt.result).toBeOk(Cl.bool(true));
  // deposit ft so we can propose
  const depositReceipt = simnet.callPublicFn(
    contractAddress,
    "deposit-ft",
    [Cl.principal(daoTokenAddress), Cl.uint(1000)],
    sender
  );
  expect(depositReceipt.result).toBeOk(Cl.bool(true));
}

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // deposit-stx() tests
  ////////////////////////////////////////
  it("deposit-stx() succeeds and deposits STX to the vault", () => {
    // arrange
    const amount = 1000000; // 1 STX
    const initialBalanceResponse = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance-stx",
      [],
      deployer
    );
    const initialBalance = Number(cvToValue(initialBalanceResponse.result));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const newBalanceResponse = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance-stx",
      [],
      deployer
    );
    const newBalance = Number(cvToValue(newBalanceResponse.result));
    expect(newBalance).toBe(initialBalance + amount);
  });
  it("deposit-stx() emits the correct notification event", () => {
    // arrange
    const amount = 2000000; // 2 STX
    const expectedEvent = {
      notification: "deposit-stx",
      payload: {
        amount: amount.toString(),
        sender: deployer,
        caller: deployer,
        recipient: contractAddress,
      },
    };
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // deposit-ft() tests
  ////////////////////////////////////////
  it("deposit-ft() fails if asset is not approved", () => {
    // arrange
    const amount = 1000;
    const unapprovedToken = `${deployer}.test-token`;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      sbtcTokenAddress,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(unapprovedToken), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
  });
  it("deposit-ft() succeeds and transfers sBTC to the vault", () => {
    // arrange
    const amount = 1000;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      sbtcTokenAddress,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("deposit-ft() succeeds and transfers DAO tokens to the vault", () => {
    // arrange
    const amount = 1000;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      sbtcTokenAddress,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // get DAO tokens from the dex
    const dexReceipt = getDaoTokens(
      daoTokenAddress,
      tokenDexContractAddress,
      deployer,
      amount
    );
    expect(dexReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(daoTokenAddress), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("deposit-ft() emits the correct notification event", () => {
    // arrange
    const amount = 2000;
    const expectedEvent = {
      notification: "deposit-ft",
      payload: {
        amount: amount.toString(),
        assetContract: sbtcTokenAddress,
        sender: deployer,
        caller: deployer,
        recipient: contractAddress,
      },
    };
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      sbtcTokenAddress,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // withdraw-stx() tests
  ////////////////////////////////////////
  it("withdraw-stx() fails if caller is not the user", () => {
    // arrange
    const amount = 1000000; // 1 STX
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("withdraw-stx() succeeds and transfers STX to user", () => {
    // arrange
    const amount = 1000000; // 1 STX
    // deposit stx so we can withdraw
    const faucetReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("withdraw-stx() emits the correct notification event", () => {
    // arrange
    const amount = 2000000; // 2 STX
    const expectedEvent = {
      notification: "withdraw-stx",
      payload: {
        amount: amount.toString(),
        sender: contractAddress,
        caller: deployer,
        recipient: deployer,
      },
    };
    // deposit stx so we can withdraw
    const faucetReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // withdraw-ft() tests
  ////////////////////////////////////////
  it("withdraw-ft() fails if caller is not the user", () => {
    // arrange
    const amount = 1000;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("withdraw-ft() fails if asset is not approved", () => {
    // arrange
    const amount = 1000;
    const unapprovedToken = `${deployer}.test-token`;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(unapprovedToken), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
  });
  it("withdraw-ft() succeeds and transfers FT to the user", () => {
    // arrange
    const amount = 1000;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      sbtcTokenAddress,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // deposit ft so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("withdraw-ft() emits the correct notification event", () => {
    // arrange
    const amount = 2000;
    const expectedEvent = {
      notification: "withdraw-ft",
      payload: {
        amount: amount.toString(),
        assetContract: sbtcTokenAddress,
        sender: contractAddress,
        caller: deployer,
        recipient: deployer,
      },
    };
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      sbtcTokenAddress,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // deposit ft so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // approve-asset() tests
  ////////////////////////////////////////
  it("approve-asset() fails if caller is not the user", () => {
    // arrange
    const newAsset = `${deployer}.test-token`;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(newAsset)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("approve-asset() succeeds and sets new approved asset", () => {
    // arrange
    const newAsset = `${deployer}.new-token`;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(newAsset)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    // verify the asset is now approved
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(newAsset)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(true));
  });
  it("approve-asset() emits the correct notification event", () => {
    // arrange
    const newAsset = `${deployer}.another-token`;
    const expectedEvent = {
      notification: "approve-asset",
      payload: {
        asset: newAsset,
        approved: true,
        sender: deployer,
        caller: deployer,
      },
    };
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(newAsset)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // revoke-asset() tests
  ////////////////////////////////////////
  it("revoke-asset() fails if caller is not the user", () => {
    // arrange
    const asset = `${deployer}.test-token`;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("revoke-asset() succeeds and removes approved asset", () => {
    // arrange
    const asset = `${deployer}.test-token`;
    // approve the asset first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    // verify the asset is now revoked
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
  });
  it("revoke-asset() emits the correct notification event", () => {
    // arrange
    const asset = `${deployer}.test-token`;
    const expectedEvent = {
      notification: "revoke-asset",
      payload: {
        asset: asset,
        approved: false,
        sender: deployer,
        caller: deployer,
      },
    };
    // approve the asset first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
    // verify the asset is now revoked
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
  });
  ////////////////////////////////////////
  // proxy-propose-action() tests
  ////////////////////////////////////////
  it("proxy-propose-action() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const message = "hello world";
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "proxy-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.bufferFromAscii(message),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("proxy-propose-action() succeeds and creates a new action proposal", () => {
    // arrange
    const message = "hello world";
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "proxy-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.bufferFromAscii(message),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("proxy-propose-action() emits the correct notification event", () => {
    // arrange
    const message = "hello world";
    const encodedMessage = `0x${Buffer.from(message).toString("hex")}`;
    const expectedEvent = {
      notification: "proxy-propose-action",
      payload: {
        proposalContract: actionProposalsV2ContractAddress,
        action: sendMessageActionContractAddress,
        parameters: encodedMessage,
        sender: deployer,
        caller: deployer,
      },
    };
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "proxy-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.bufferFromAscii(message),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // proxy-create-proposal() tests
  ////////////////////////////////////////
  it("proxy-create-proposal() fails if caller is not authorized (user or agent)", () => {
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "proxy-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("proxy-create-proposal() succeeds and creates a new core proposal", () => {
    // arrange
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "proxy-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("proxy-create-proposal() emits the correct notification event", () => {
    // arrange
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // format expected event like print event
    const expectedEvent = {
      notification: "proxy-create-proposal",
      payload: {
        proposalContract: coreProposalsV2ContractAddress,
        proposal: baseEnableExtensionContractAddress,
        sender: deployer,
        caller: deployer,
      },
    };
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "proxy-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // vote-on-action-proposal() tests
  ////////////////////////////////////////
  it("vote-on-action-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const proposalId = 1;
    const vote = true;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("vote-on-action-proposal() succeeds and votes on an action proposal", () => {
    // arrange
    const message = "hello world";
    const proposalId = 1;
    const vote = true;
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // create a new action proposal
    const proposeReceipt = simnet.callPublicFn(
      contractAddress,
      "proxy-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.bufferFromAscii(message),
      ],
      deployer
    );
    expect(proposeReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the voting delay
    simnet.mineEmptyBlocks(actionProposalVotingConfig.votingDelay);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("vote-on-action-proposal() emits the correct notification event", () => {
    // arrange
    const message = "hello world";
    const proposalId = 1;
    const vote = true;
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // create a new action proposal
    const proposeReceipt = simnet.callPublicFn(
      contractAddress,
      "proxy-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.bufferFromAscii(message),
      ],
      deployer
    );
    expect(proposeReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the voting delay
    simnet.mineEmptyBlocks(actionProposalVotingConfig.votingDelay);
    // format expected event like print event
    const expectedEvent = {
      notification: "vote-on-action-proposal",
      payload: {
        proposalContract: actionProposalsV2ContractAddress,
        proposalId: proposalId.toString(),
        vote: vote,
        sender: deployer,
        caller: deployer,
      },
    };
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // vote-on-core-proposal() tests
  ////////////////////////////////////////
  it("vote-on-core-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const vote = true;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-core-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.bool(vote),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("vote-on-core-proposal() succeeds and votes on a core proposal", () => {
    // arrange
    const vote = true;
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // create a new core proposal
    const createReceipt = simnet.callPublicFn(
      contractAddress,
      "proxy-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
      ],
      deployer
    );
    expect(createReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingDelay);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-core-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.bool(vote),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("vote-on-core-proposal() emits the correct notification event", () => {
    // arrange
    const vote = true;
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // create a new core proposal
    const createReceipt = simnet.callPublicFn(
      contractAddress,
      "proxy-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
      ],
      deployer
    );
    expect(createReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingDelay);
    // format expected event like print event
    const expectedEvent = {
      notification: "vote-on-core-proposal",
      payload: {
        proposalContract: coreProposalsV2ContractAddress,
        proposal: baseEnableExtensionContractAddress,
        vote: vote,
        sender: deployer,
        caller: deployer,
      },
    };
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-core-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.bool(vote),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
  ////////////////////////////////////////
  // conclude-action-proposal() tests
  ////////////////////////////////////////
  it("conclude-action-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const proposalId = 1;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.uint(proposalId),
        Cl.principal(sendMessageActionContractAddress),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("conclude-action-proposal() succeeds and concludes an action proposal", () => {
    // arrange
    const message = "hello world";
    const proposalId = 1;
    // construct dao / setup vault with dao tokens
    setupVault(deployer);
    fundVoters(daoTokenAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);
    // create a new action proposal
    const proposeReceipt = simnet.callPublicFn(
      contractAddress,
      "proxy-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.bufferFromAscii(message),
      ],
      deployer
    );
    expect(proposeReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the voting delay
    simnet.mineEmptyBlocks(actionProposalVotingConfig.votingDelay);
    // vote on the proposal
    const voteReceipts = [
      // cast two regular votes to pass proposal
      simnet.callPublicFn(
        actionProposalsV2ContractAddress,
        "vote-on-proposal",
        [Cl.uint(proposalId), Cl.bool(true)],
        address2
      ),
      simnet.callPublicFn(
        actionProposalsV2ContractAddress,
        "vote-on-proposal",
        [Cl.uint(proposalId), Cl.bool(true)],
        address1
      ),
      // cast vote through our user/agent vault
      simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.principal(actionProposalsV2ContractAddress),
          Cl.uint(proposalId),
          Cl.bool(true),
        ],
        deployer
      ),
    ];
    for (const voteReceipt of voteReceipts) {
      expect(voteReceipt.result).toBeOk(Cl.bool(true));
    }
    // progress the chain past the voting period and execution delay
    simnet.mineEmptyBlocks(actionProposalVotingConfig.votingPeriod);
    simnet.mineEmptyBlocks(actionProposalVotingConfig.votingDelay);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.uint(proposalId),
        Cl.principal(sendMessageActionContractAddress),
      ],
      deployer
    );
    console.log("conclude receipt");
    console.log(JSON.stringify(receipt, null, 2));
    // assert

    for (const event of receipt.events) {
      console.log(convertSIP019PrintEvent(event));
    }
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  ////////////////////////////////////////
  // conclude-core-proposal() tests
  ////////////////////////////////////////
  it("conclude-core-proposal() fails if caller is not authorized (user or agent)", () => {
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-core-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
});
describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // is-approved-asset() tests
  ////////////////////////////////////////
  it("is-approved-asset() returns expected values for an asset", () => {
    // arrange
    const asset = `${deployer}.test-token`;
    // act
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );
    // assert
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
    // approve the asset
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));
    // act
    const isApproved2 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );
    // assert
    expect(isApproved2.result).toStrictEqual(Cl.bool(true));
    // revoke the asset
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));
    // act
    const isApproved3 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );
    // assert
    expect(isApproved3.result).toStrictEqual(Cl.bool(false));
  });
  ////////////////////////////////////////
  // get-balance-stx() tests
  ////////////////////////////////////////
  it("get-balance-stx() returns the correct STX balance", () => {
    // arrange
    const amount = 1000000; // 1 STX
    // act
    const balance = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance-stx",
      [],
      deployer
    );
    // assert
    expect(balance.result).toStrictEqual(Cl.uint(0));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
    // assert
    const balance2 = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance-stx",
      [],
      deployer
    );
    expect(balance2.result).toStrictEqual(Cl.uint(amount));
  });
  ////////////////////////////////////////
  // get-configuration() tests
  ////////////////////////////////////////
  it("get-configuration() returns the correct configuration", () => {
    // arrange
    // format expected config like print event
    const expectedConfig = {
      notification: "get-configuration",
      payload: {
        agent: address2,
        user: deployer,
        vault: contractAddress,
        daoToken: daoTokenAddress,
        sbtcToken: sbtcTokenAddress,
      },
    };
    // act
    const config = simnet.callReadOnlyFn(
      contractAddress,
      "get-configuration",
      [],
      deployer
    );
    // assert
    const event: ClarityEvent = {
      event: "print_event",
      data: {
        value: Cl.tuple({
          notification: Cl.stringAscii("get-configuration"),
          payload: config.result,
        }),
      },
    };
    const printEvent = convertSIP019PrintEvent(event);
    expect(printEvent).toStrictEqual(expectedConfig);
  });
});
