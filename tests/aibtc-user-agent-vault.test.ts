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
const coreProposalsV2ContractAddress = `${deployer}.aibtc-core-proposals-v2`;

// Error codes
const ErrCode = UserAgentVaultErrCode;

// simnet.callPublicFn(sbtcTokenAddress, "faucet", [], user);

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
  ////////////////////////////////////////
  // proxy-create-proposal() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // vote-on-action-proposal() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // vote-on-core-proposal() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // conclude-action-proposal() tests
  ////////////////////////////////////////
  ////////////////////////////////////////
  // conclude-core-proposal() tests
  ////////////////////////////////////////
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
/*

  // DAO Interaction Tests
  describe("proxy-propose-action()", () => {
    const actionProposalsAddress = `${deployer}.aibtc-action-proposals-v2`;
    const actionAddress = `${deployer}.aibtc-action-send-message`;
    const parameters = Cl.bufferFromAscii("test message");

    beforeEach(() => {
      // Mock the propose-action function to return a successful response
      simnet.mineEmptyBlocks(10); // Ensure we're at a new block
    });

    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters,
        ],
        otherUser
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds when called by the user", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // check proposal status in the dao
      const proposalStatus = simnet.callReadOnlyFn(
        baseDaoContractAddress,
        "is-extension",
        [Cl.principal(actionProposalsV2ContractAddress)],
        deployer
      );
      const actionStatus = simnet.callReadOnlyFn(
        baseDaoContractAddress,
        "is-extension",
        [Cl.principal(actionAddress)],
        deployer
      );

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters,
        ],
        user
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("succeeds when called by the agent", () => {
      // Setup: Get DAO tokens for the agent
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, agent, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters,
        ],
        agent
      );

      // Assert - we expect this to succeed in the test environment
      // The operation might fail for other reasons, but the authorization should pass
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters,
        ],
        user
      );

      // Assert - we don't check the result here, just the notification
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("proxy-propose-action");
      expect(notification.payload.value["action-proposals"].value).toBe(
        actionProposalsAddress
      );
      expect(notification.payload.value.action.value).toBe(actionAddress);
      expect(notification.payload.value.parameters.value).toBe(
        parameters.buffer.toString("hex")
      );
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

  describe("proxy-create-proposal()", () => {
    const coreProposalsAddress = `${deployer}.aibtc-core-proposals-v2`;
    const proposalAddress = `${deployer}.aibtc-base-enable-extension`;

    beforeEach(() => {
      // Mine empty blocks to ensure we're at a new block
      simnet.mineEmptyBlocks(10);
    });

    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        otherUser
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds when called by the user", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        user
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.uint(1));
    });

    it("succeeds when called by the agent", () => {
      // Setup: Get DAO tokens for the agent
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, agent, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        agent
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.uint(1));
    });

    it("emits the correct notification event", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        user
      );

      // Assert - we don't check the result here, just the notification
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("proxy-create-proposal");
      expect(notification.payload.value["core-proposals"].value).toBe(
        coreProposalsAddress
      );
      expect(notification.payload.value.proposal.value).toBe(proposalAddress);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

  describe("vote-on-action-proposal()", () => {
    const actionProposalsAddress = `${deployer}.aibtc-action-proposals-v2`;
    const proposalId = 1;
    const vote = true;

    beforeEach(() => {
      // Mine empty blocks to ensure we're at a new block
      simnet.mineEmptyBlocks(10);
    });

    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote),
        ],
        otherUser
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds when called by the user", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote),
        ],
        user
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("succeeds when called by the agent", () => {
      // Setup: Get DAO tokens for the agent
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, agent, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote),
        ],
        agent
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote),
        ],
        user
      );

      // Assert - we don't check the result here, just the notification
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("vote-on-action-proposal");
      expect(notification.payload.value["action-proposals"].value).toBe(
        actionProposalsAddress
      );
      expect(notification.payload.value.proposalId.value).toBe(
        proposalId.toString()
      );
      expect(notification.payload.value.vote.value).toBe(vote);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

  describe("vote-on-core-proposal()", () => {
    const coreProposalsAddress = `${deployer}.aibtc-core-proposals-v2`;
    const proposalAddress = `${deployer}.aibtc-base-enable-extension`;
    const vote = true;

    beforeEach(() => {
      // Mine empty blocks to ensure we're at a new block
      simnet.mineEmptyBlocks(10);
    });

    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote),
        ],
        otherUser
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds when called by the user", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote),
        ],
        user
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("succeeds when called by the agent", () => {
      // Setup: Get DAO tokens for the agent
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, agent, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote),
        ],
        agent
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote),
        ],
        user
      );

      // Assert - we don't check the result here, just the notification
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("vote-on-core-proposal");
      expect(notification.payload.value["core-proposals"].value).toBe(
        coreProposalsAddress
      );
      expect(notification.payload.value.proposal.value).toBe(proposalAddress);
      expect(notification.payload.value.vote.value).toBe(vote);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

  describe("conclude-action-proposal()", () => {
    const actionProposalsAddress = `${deployer}.aibtc-action-proposals-v2`;
    const actionAddress = `${deployer}.aibtc-action-send-message`;
    const proposalId = 1;

    beforeEach(() => {
      // Mine empty blocks to ensure we're at a new block
      simnet.mineEmptyBlocks(10);
    });

    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
        ],
        otherUser
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds when called by the user", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
        ],
        user
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("succeeds when called by the agent", () => {
      // Setup: Get DAO tokens for the agent
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, agent, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
        ],
        agent
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
        ],
        user
      );

      // Assert - we don't check the result here, just the notification
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("conclude-action-proposal");
      expect(notification.payload.value["action-proposals"].value).toBe(
        actionProposalsAddress
      );
      expect(notification.payload.value.proposalId.value).toBe(
        proposalId.toString()
      );
      expect(notification.payload.value.action.value).toBe(actionAddress);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

  describe("conclude-core-proposal()", () => {
    const coreProposalsAddress = `${deployer}.aibtc-core-proposals-v2`;
    const proposalAddress = `${deployer}.aibtc-base-enable-extension`;

    beforeEach(() => {
      // Mine empty blocks to ensure we're at a new block
      simnet.mineEmptyBlocks(10);
    });

    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        otherUser
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds when called by the user", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        user
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("succeeds when called by the agent", () => {
      // Setup: Get DAO tokens for the agent
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, agent, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        agent
      );

      // Assert - we expect this to succeed in the test environment
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Setup: Get DAO tokens for the user
      getDaoTokens(daoTokenAddress, tokenDexContractAddress, user, 1000);

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
        ],
        user
      );

      // Assert - we don't check the result here, just the notification
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("conclude-core-proposal");
      expect(notification.payload.value["core-proposals"].value).toBe(
        coreProposalsAddress
      );
      expect(notification.payload.value.proposal.value).toBe(proposalAddress);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

});
*/
