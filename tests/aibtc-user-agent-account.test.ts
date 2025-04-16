import { Cl, ClarityValue, cvToValue, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { UserAgentAccountErrCode } from "./error-codes";
import {
  constructDao,
  convertSIP019PrintEvent,
  dbgLog,
  fundVoters,
  getDaoTokens,
  SBTC_CONTRACT,
  VOTING_CONFIG,
} from "./test-utilities";
import { ClarityEvent } from "@hirosystems/clarinet-sdk";

// Define constants and accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

// Contract references
const contractName = "aibtc-user-agent-account";
const contractAddress = `${deployer}.${contractName}`;
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
const ErrCode = UserAgentAccountErrCode;

function setupAccount(sender: string, satsAmount: number = 1000000) {
  // construct the dao so we can call extensions
  const constructReceipt = constructDao(
    sender,
    baseDaoContractAddress,
    bootstrapContractAddress
  );
  expect(constructReceipt.result).toBeOk(Cl.bool(true));
  // get dao tokens from the dex
  const dexReceipt = getDaoTokens(
    daoTokenAddress,
    tokenDexContractAddress,
    sender,
    satsAmount
  );
  expect(dexReceipt.result).toBeOk(Cl.bool(true));
  // get our balances from the assets map
  const balancesMap = simnet.getAssetsMap();
  dbgLog(balancesMap);
  const aibtcKey = ".aibtc-token.SYMBOL";
  const sbtcKey = ".sbtc-token.sbtc-token";
  const stxKey = "STX";
  const deployerBalances = {
    sbtc: balancesMap.get(sbtcKey)?.get(deployer) ?? 0n,
    aibtc: balancesMap.get(aibtcKey)?.get(deployer) ?? 0n,
    stx: balancesMap.get(stxKey)?.get(deployer) ?? 0n,
  };
  dbgLog(`deployerBalances: ${JSON.stringify(deployerBalances)}`);

  // deposit sBTC so we can buy DAO tokens
  const depositReceiptSbtc = simnet.callPublicFn(
    contractAddress,
    "deposit-ft",
    [Cl.principal(SBTC_CONTRACT), Cl.uint(satsAmount)],
    sender
  );
  expect(depositReceiptSbtc.result).toBeOk(Cl.bool(true));

  // deposit ft so we can propose
  const depositReceipt = simnet.callPublicFn(
    contractAddress,
    "deposit-ft",
    [Cl.principal(daoTokenAddress), Cl.uint(deployerBalances.aibtc)],
    sender
  );
  expect(depositReceipt.result).toBeOk(Cl.bool(true));
}

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // deposit-stx() tests
  ////////////////////////////////////////
  it("deposit-stx() succeeds and deposits STX to the account", () => {
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
    const amount = 10000000000;
    const unapprovedToken = `${deployer}.test-token`;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
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
  it("deposit-ft() succeeds and transfers sBTC to the account", () => {
    // arrange
    const sbtcAmount = 100000000;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(sbtcAmount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("deposit-ft() succeeds and transfers DAO tokens to the account", () => {
    // arrange
    const amount = 1000000;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain so deployment are complete
    simnet.mineEmptyBurnBlocks(10);
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
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
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
        assetContract: SBTC_CONTRACT,
        sender: deployer,
        caller: deployer,
        recipient: contractAddress,
      },
    };
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
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
    const amount = 10000000000;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("withdraw-ft() fails if asset is not approved", () => {
    // arrange
    const amount = 10000000000;
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
    const sbtcAmount = 100000000;
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // deposit ft so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(sbtcAmount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(sbtcAmount)],
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
        assetContract: SBTC_CONTRACT,
        sender: contractAddress,
        caller: deployer,
        recipient: deployer,
      },
    };
    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // deposit ft so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
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
  const memoContext = "Can pass up to 1024 characters for additional context.";

  it("acct-propose-action() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const message = Cl.stringAscii("hello world");
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("acct-propose-action() succeeds and creates a new action proposal", () => {
    // arrange
    const message = Cl.stringAscii("hello world");
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("acct-propose-action() emits the correct notification event", () => {
    // arrange
    const message = Cl.stringAscii("hello world");
    const expectedEvent = {
      notification: "acct-propose-action",
      payload: {
        proposalContract: actionProposalsV2ContractAddress,
        action: sendMessageActionContractAddress,
        parameters: cvToValue(Cl.buffer(Cl.serialize(message))),
        sender: deployer,
        caller: deployer,
      },
    };
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii(memoContext)),
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
  it("acct-create-proposal() fails if caller is not authorized (user or agent)", () => {
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("acct-create-proposal() succeeds and creates a new core proposal", () => {
    // arrange
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("acct-create-proposal() emits the correct notification event", () => {
    // arrange
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // format expected event like print event
    const expectedEvent = {
      notification: "acct-create-proposal",
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
      "acct-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.some(Cl.stringAscii(memoContext)),
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
    const message = Cl.stringAscii("hello world");
    const proposalId = 1;
    const vote = true;
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // create a new action proposal
    const proposeReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii(memoContext)),
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
    const message = Cl.stringAscii("hello world");
    const proposalId = 1;
    const vote = true;
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // create a new action proposal
    const proposeReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii(memoContext)),
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
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // create a new core proposal
    const createReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.some(Cl.stringAscii(memoContext)),
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
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // create a new core proposal
    const createReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.some(Cl.stringAscii(memoContext)),
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
    const message = Cl.stringAscii("hello world");
    const proposalId = 1;
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    fundVoters(daoTokenAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);
    // create a new action proposal
    const proposeReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii(memoContext)),
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
      // cast vote through our user/agent account
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
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("conclude-action-proposal() emits the correct notification event", () => {
    // arrange
    const message = Cl.stringAscii("hello world");
    const proposalId = 1;
    const expectedEvent = {
      notification: "conclude-action-proposal",
      payload: {
        proposalContract: actionProposalsV2ContractAddress,
        proposalId: proposalId.toString(),
        action: sendMessageActionContractAddress,
        sender: deployer,
        caller: deployer,
      },
    };
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    fundVoters(daoTokenAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);
    // create a new action proposal
    const proposeReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-propose-action",
      [
        Cl.principal(actionProposalsV2ContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii(memoContext)),
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
      // cast vote through our user/agent account
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
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
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
  it("conclude-core-proposal() succeeds and concludes a core proposal", () => {
    // arrange
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    fundVoters(daoTokenAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // create a new core proposal
    const createReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      deployer
    );
    expect(createReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingDelay);
    // vote on the proposal
    const voteReceipts = [
      // cast two regular votes to pass proposal
      simnet.callPublicFn(
        coreProposalsV2ContractAddress,
        "vote-on-proposal",
        [Cl.principal(baseEnableExtensionContractAddress), Cl.bool(true)],
        address2
      ),
      simnet.callPublicFn(
        coreProposalsV2ContractAddress,
        "vote-on-proposal",
        [Cl.principal(baseEnableExtensionContractAddress), Cl.bool(true)],
        address1
      ),
      // cast vote through our user/agent account
      simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.principal(coreProposalsV2ContractAddress),
          Cl.principal(baseEnableExtensionContractAddress),
          Cl.bool(true),
        ],
        deployer
      ),
    ];
    for (const voteReceipt of voteReceipts) {
      expect(voteReceipt.result).toBeOk(Cl.bool(true));
    }
    // progress the chain past the voting period and execution delay
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingDelay);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-core-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("conclude-core-proposal() emits the correct notification event", () => {
    // arrange
    const vote = true;
    const expectedEvent = {
      notification: "conclude-core-proposal",
      payload: {
        proposalContract: coreProposalsV2ContractAddress,
        proposal: baseEnableExtensionContractAddress,
        sender: deployer,
        caller: deployer,
      },
    };
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    fundVoters(daoTokenAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);
    // progress the chain past the first voting period
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    // create a new core proposal
    const createReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-create-proposal",
      [
        Cl.principal(coreProposalsV2ContractAddress),
        Cl.principal(baseEnableExtensionContractAddress),
        Cl.some(Cl.stringAscii(memoContext)),
      ],
      deployer
    );
    expect(createReceipt.result).toBeOk(Cl.bool(true));
    // progress the chain past the voting delay
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingDelay);
    // vote on the proposal
    const voteReceipts = [
      // cast two regular votes to pass proposal
      simnet.callPublicFn(
        coreProposalsV2ContractAddress,
        "vote-on-proposal",
        [Cl.principal(baseEnableExtensionContractAddress), Cl.bool(true)],
        address2
      ),
      simnet.callPublicFn(
        coreProposalsV2ContractAddress,
        "vote-on-proposal",
        [Cl.principal(baseEnableExtensionContractAddress), Cl.bool(true)],
        address1
      ),
      // cast vote through our user/agent account
      simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.principal(coreProposalsV2ContractAddress),
          Cl.principal(baseEnableExtensionContractAddress),
          Cl.bool(true),
        ],
        deployer
      ),
    ];
    for (const voteReceipt of voteReceipts) {
      expect(voteReceipt.result).toBeOk(Cl.bool(true));
    }
    // progress the chain past the voting period and execution delay
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingPeriod);
    simnet.mineEmptyBlocks(coreProposalVotingConfig.votingDelay);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-core-proposal",
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
  // acct-approve-dex() tests
  ////////////////////////////////////////
  it("acct-approve-dex() fails if caller is not the user", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("acct-approve-dex() succeeds and sets new approved dex", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    // verify the dex is now approved
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(true));
  });
  it("acct-approve-dex() emits the correct notification event", () => {
    // arrange
    const dex = `${deployer}.test-dex-2`;
    const expectedEvent = {
      notification: "acct-approve-dex",
      payload: {
        dexContract: dex,
        approved: true,
        sender: deployer,
        caller: deployer,
      },
    };
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
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
  // acct-revoke-dex() tests
  ////////////////////////////////////////
  it("acct-revoke-dex() fails if caller is not the user", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("acct-revoke-dex() succeeds and removes approved dex", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;
    // approve the dex first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    // verify the dex is now revoked
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
  });
  it("acct-revoke-dex() emits the correct notification event", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;
    const expectedEvent = {
      notification: "acct-revoke-dex",
      payload: {
        dexContract: dex,
        approved: false,
        sender: deployer,
        caller: deployer,
      },
    };
    // approve the dex first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
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
  // set-agent-can-buy-sell() tests
  ////////////////////////////////////////
  it("set-agent-can-buy-sell() fails if caller is not the user", () => {
    // arrange
    const canBuySell = true;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(canBuySell)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("set-agent-can-buy-sell() succeeds and sets agent permission", () => {
    // arrange
    const canBuySell = true;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(canBuySell)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("set-agent-can-buy-sell() emits the correct notification event", () => {
    // arrange
    const canBuySell = true;
    const expectedEvent = {
      notification: "set-agent-can-buy-sell",
      payload: {
        canBuySell: canBuySell,
        sender: deployer,
        caller: deployer,
      },
    };
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(canBuySell)],
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
  // acct-buy-asset() tests
  ////////////////////////////////////////
  it("acct-buy-asset() fails if caller is not authorized", () => {
    // arrange
    const amount = 10000000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });
  it("acct-buy-asset() fails if agent can't buy/sell", () => {
    // arrange
    const amount = 10000000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });
  it("acct-buy-asset() fails if dex is not approved", () => {
    // arrange
    const amount = 10000000000;
    const dex = `${deployer}.test-dex-1`;
    const asset = daoTokenAddress;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
  });
  it("acct-buy-asset() succeeds when called by user", () => {
    // arrange
    const amount = 10000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // get our balances from the assets map
    const balancesMap = simnet.getAssetsMap();
    dbgLog(balancesMap);
    const aibtcKey = ".aibtc-token.SYMBOL";
    const sbtcKey = ".sbtc-token.sbtc-token";
    const stxKey = "STX";
    const accountBalances = {
      sbtc: balancesMap.get(sbtcKey)?.get(contractAddress) ?? 0n,
      aibtc: balancesMap.get(aibtcKey)?.get(contractAddress) ?? 0n,
      stx: balancesMap.get(stxKey)?.get(contractAddress) ?? 0n,
    };
    dbgLog(`accountBalances: ${JSON.stringify(accountBalances)}`);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("acct-buy-asset() succeeds when called by agent with permission", () => {
    // arrange
    const amount = 10000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // enable agent to buy/sell
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("acct-buy-asset() emits the correct notification event", () => {
    // arrange
    const amount = 10000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    const expectedEvent = {
      notification: "acct-buy-asset",
      payload: {
        dexContract: dex,
        asset: asset,
        amount: amount.toString(),
        sender: deployer,
        caller: deployer,
      },
    };
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
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
  // acct-sell-asset() tests
  ////////////////////////////////////////
  it("acct-sell-asset() fails if caller is not authorized", () => {
    // arrange
    const amount = 10000000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address3
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });
  it("acct-sell-asset() fails if agent can't buy/sell", () => {
    // arrange
    const amount = 10000000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    // disable agent buy/sell
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });
  it("acct-sell-asset() fails if dex is not approved", () => {
    // arrange
    const amount = 10000000000;
    const dex = `${deployer}.test-dex-1`;
    const asset = daoTokenAddress;
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
  });
  it("acct-sell-asset() succeeds when called by user", () => {
    // arrange
    const amount = 1000000000000n; // sell 10000 dao tokens
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    dbgLog(simnet.getAssetsMap(), {
      titleBefore: "asset map before setup",
    });

    // construct dao / setup account with dao tokens
    setupAccount(deployer);

    dbgLog(simnet.getAssetsMap(), {
      titleBefore: "asset map after setup",
    });

    // get sell info from dex
    const sellInfoCV = simnet.callReadOnlyFn(
      tokenDexContractAddress,
      "get-out",
      [Cl.uint(amount)],
      deployer
    ).result;
    dbgLog(cvToValue(sellInfoCV), {
      titleBefore: "sell info from dex",
    });

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    dbgLog(JSON.stringify(receipt, null, 2), {
      titleBefore: "acct-sell-asset receipt",
    });

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("acct-sell-asset() succeeds when called by agent with permission", () => {
    // arrange
    const amount = 1000000000000n; // sell 10000 dao tokens
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // construct dao / setup account with dao tokens
    setupAccount(deployer);

    // enable agent to buy/sell
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  it("acct-sell-asset() emits the correct notification event", () => {
    // arrange
    const amount = 1000000000000n; // sell 10000 dao tokens
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    // construct dao / setup account with dao tokens
    setupAccount(deployer);
    // build expected print event
    const expectedEvent = {
      notification: "acct-sell-asset",
      payload: {
        dexContract: dex,
        asset: asset,
        amount: amount.toString(),
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // is-approved-dex() tests
  ////////////////////////////////////////
  it("is-approved-dex() returns expected values for a dex", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;
    // act
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );
    // assert
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
    // approve the dex
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));
    // act
    const isApproved2 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );
    // assert
    expect(isApproved2.result).toStrictEqual(Cl.bool(true));
    // revoke the dex
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));
    // act
    const isApproved3 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );
    // assert
    expect(isApproved3.result).toStrictEqual(Cl.bool(false));
  });

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
    const expectedConfig = {
      account: contractAddress,
      agent: address2,
      owner: deployer,
      daoToken: daoTokenAddress,
      daoTokenDex: tokenDexContractAddress,
      sbtcToken: SBTC_CONTRACT,
    };
    // act
    const configCV = simnet.callReadOnlyFn(
      contractAddress,
      "get-configuration",
      [],
      deployer
    );

    // Convert the Clarity value to a JavaScript object
    const config = cvToValue(configCV.result) as TupleCV;
    // Convert the TupleCV to a plain object
    console.log(`config: ${JSON.stringify(config)}`);
    const configData = Object.fromEntries(
      Object.entries(config).map(([key, value]: [string, ClarityValue]) => {
        return [key, cvToValue(value, true)];
      })
    );
    // assert
    expect(configData).toEqual(expectedConfig);
  });
});
