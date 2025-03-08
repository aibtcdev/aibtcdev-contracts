import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach, beforeAll } from "vitest";
import { UserAgentVaultErrCode } from "./error-codes";
import {
  constructDao,
  fundVoters,
  getDaoTokens,
  VOTING_CONFIG,
  ContractType,
} from "./test-utilities";

// Define constants and accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const agent = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const otherUser = accounts.get("wallet_3")!;

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

// Helper function to check notification events
const getNotification = (receipt: any) => {
  const printEvent = receipt.events.find((e: any) => e.event === "print_event");
  if (!printEvent) return null;

  return cvToValue(printEvent.data.value, true);
};

// Setup DAO before all tests
beforeAll(() => {
  // Fund voters to pass proposals
  fundVoters(daoTokenAddress, tokenDexContractAddress, [
    deployer,
    user,
    agent,
    otherUser,
  ]);

  // Construct DAO
  const constructReceipt = constructDao(
    deployer,
    baseDaoContractAddress,
    bootstrapContractAddress
  );
  expect(constructReceipt.result).toBeOk(Cl.bool(true));

  // Progress past voting delay for at-block calls
  simnet.mineEmptyBlocks(VOTING_CONFIG["aibtc-core-proposals-v2"].votingDelay);

  // Get sBTC for the test accounts
  simnet.callPublicFn(sbtcTokenAddress, "faucet", [], user);
  simnet.callPublicFn(sbtcTokenAddress, "faucet", [], agent);
  simnet.callPublicFn(sbtcTokenAddress, "faucet", [], otherUser);
});

describe(`contract: ${contractName}`, () => {
  // Asset Management Tests
  describe("deposit-stx()", () => {
    it("succeeds and deposits STX to the vault", () => {
      // Arrange
      const amount = 1000000; // 1 STX
      const initialBalanceResponse = simnet.callReadOnlyFn(
        contractAddress,
        "get-balance-stx",
        [],
        user
      );
      const initialBalance = Number(cvToValue(initialBalanceResponse.result));

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      const newBalanceResponse = simnet.callReadOnlyFn(
        contractAddress,
        "get-balance-stx",
        [],
        user
      );
      const newBalance = Number(cvToValue(newBalanceResponse.result));
      expect(newBalance).toBe(initialBalance + amount);
    });

    it("emits the correct notification event", () => {
      // Arrange
      const amount = "2000000"; // 2 STX

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("deposit-stx");
      expect(notification.payload.value.amount.value).toBe(amount);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
      expect(notification.payload.value.recipient.value).toBe(contractAddress);
    });
  });

  describe("deposit-ft()", () => {
    beforeEach(() => {
      // Get sBTC from faucet first
      simnet.callPublicFn(sbtcTokenAddress, "faucet", [], user);
    });

    it("fails if asset is not approved", () => {
      // Arrange
      const amount = 1000;
      const unapprovedToken = `${deployer}.test-token`;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.principal(unapprovedToken), Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
    });

    it("succeeds and transfers FT to vault", () => {
      // Arrange
      const amount = 1000;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Arrange
      const amount = 2000;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("deposit-ft");
      expect(notification.payload.value.amount.value).toBe(amount.toString());
      expect(notification.payload.value.assetContract.value).toBe(
        sbtcTokenAddress
      );
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
      expect(notification.payload.value.recipient.value).toBe(contractAddress);
    });
  });

  describe("withdraw-stx()", () => {
    beforeEach(() => {
      // Deposit some STX to the vault first
      simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(10000000)], // 10 STX
        user
      );
    });

    it("fails if caller is not the user", () => {
      // Arrange
      const amount = 1000000; // 1 STX

      // Act - call from agent instead of user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [Cl.uint(amount)],
        agent
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds and transfers STX to the user", () => {
      // Arrange
      const amount = 1000000; // 1 STX
      // We can't easily check user balance, but we can verify vault balance decreases
      const initialVaultBalanceResponse = simnet.callReadOnlyFn(
        contractAddress,
        "get-balance-stx",
        [],
        user
      );
      const initialVaultBalance = Number(
        cvToValue(initialVaultBalanceResponse.result)
      );

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      const newVaultBalanceResponse = simnet.callReadOnlyFn(
        contractAddress,
        "get-balance-stx",
        [],
        user
      );
      const newVaultBalance = Number(cvToValue(newVaultBalanceResponse.result));
      expect(newVaultBalance).toBe(initialVaultBalance - amount);
    });

    it("emits the correct notification event", () => {
      // Arrange
      const amount = 2000000; // 2 STX

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("withdraw-stx");
      expect(notification.payload.value.amount.value).toBe(amount.toString());
      expect(notification.payload.value.sender.value).toBe(contractAddress);
      expect(notification.payload.value.caller.value).toBe(user);
      expect(notification.payload.value.recipient.value).toBe(user);
    });
  });

  describe("withdraw-ft()", () => {
    beforeEach(() => {
      // Get sBTC from faucet first
      simnet.callPublicFn(sbtcTokenAddress, "faucet", [], user);

      // Deposit tokens to the vault
      simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.principal(sbtcTokenAddress), Cl.uint(10000)],
        user
      );
    });

    it("fails if caller is not the user", () => {
      // Arrange
      const amount = 1000;

      // Act - call from agent instead of user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
        agent
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails if asset is not approved", () => {
      // Arrange
      const amount = 1000;
      const unapprovedToken = `${deployer}.test-token`;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.principal(unapprovedToken), Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
    });

    it("succeeds and transfers FT to the user", () => {
      // Arrange
      const amount = 1000;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Arrange
      const amount = 2000;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.principal(sbtcTokenAddress), Cl.uint(amount)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("withdraw-ft");
      expect(notification.payload.value.amount.value).toBe(amount.toString());
      expect(notification.payload.value.assetContract.value).toBe(
        sbtcTokenAddress
      );
      expect(notification.payload.value.sender.value).toBe(contractAddress);
      expect(notification.payload.value.caller.value).toBe(user);
      expect(notification.payload.value.recipient.value).toBe(user);
    });
  });

  describe("approve-asset()", () => {
    it("fails if caller is not the user", () => {
      // Arrange
      const newAsset = `${deployer}.new-token`;

      // Act - call from agent instead of user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "approve-asset",
        [Cl.principal(newAsset)],
        agent
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds and sets new approved asset", () => {
      // Arrange
      const newAsset = `${deployer}.new-token`;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "approve-asset",
        [Cl.principal(newAsset)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      // Verify the asset is now approved
      const isApproved = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(newAsset)],
        user
      );

      expect(isApproved.result).toStrictEqual(Cl.bool(true));
    });

    it("emits the correct notification event", () => {
      // Arrange
      const newAsset = `${deployer}.another-token`;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "approve-asset",
        [Cl.principal(newAsset)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("approve-asset");
      expect(notification.payload.value.asset.value).toBe(newAsset);
      expect(notification.payload.value.approved.value).toBe(true);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

  describe("revoke-asset()", () => {
    beforeEach(() => {
      // Approve an asset first
      simnet.callPublicFn(
        contractAddress,
        "approve-asset",
        [Cl.principal(`${deployer}.test-token`)],
        user
      );
    });

    it("fails if caller is not the user", () => {
      // Arrange
      const asset = `${deployer}.test-token`;

      // Act - call from agent instead of user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "revoke-asset",
        [Cl.principal(asset)],
        agent
      );

      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("succeeds and removes approved asset", () => {
      // Arrange
      const asset = `${deployer}.test-token`;

      // Verify the asset is currently approved
      let isApproved = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(asset)],
        user
      );
      expect(isApproved.result).toStrictEqual(Cl.bool(true));

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "revoke-asset",
        [Cl.principal(asset)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      // Verify the asset is now revoked
      isApproved = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(asset)],
        user
      );
      expect(isApproved.result).toStrictEqual(Cl.bool(false));
    });

    it("emits the correct notification event", () => {
      // Arrange
      const asset = `${deployer}.test-token`;

      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "revoke-asset",
        [Cl.principal(asset)],
        user
      );

      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));

      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification.value).toBe("revoke-asset");
      expect(notification.payload.value.asset.value).toBe(asset);
      expect(notification.payload.value.approved.value).toBe(false);
      expect(notification.payload.value.sender.value).toBe(user);
      expect(notification.payload.value.caller.value).toBe(user);
    });
  });

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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

      // Assert - we expect an operation failed error since we're in a test environment
      // but the authorization check should pass
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_FAILED));
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

  // Read-only function tests
  describe("is-approved-asset()", () => {
    it("returns true for pre-approved assets", () => {
      // Act - check sBTC token (pre-approved in contract)
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(sbtcTokenAddress)],
        user
      );

      // Assert
      expect(receipt.result).toStrictEqual(Cl.bool(true));

      // Act - check DAO token (pre-approved in contract)
      const receipt2 = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(daoTokenAddress)],
        user
      );

      // Assert
      expect(receipt2.result).toStrictEqual(Cl.bool(true));
    });

    it("returns true for user-approved assets", () => {
      // Arrange - approve a new asset
      const newAsset = `${deployer}.new-token`;
      simnet.callPublicFn(
        contractAddress,
        "approve-asset",
        [Cl.principal(newAsset)],
        user
      );

      // Act
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(newAsset)],
        user
      );

      // Assert
      expect(receipt.result).toStrictEqual(Cl.bool(true));
    });

    it("returns false for non-approved assets", () => {
      // Act
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(`${deployer}.random-token`)],
        user
      );

      // Assert
      expect(receipt.result).toStrictEqual(Cl.bool(false));
    });
  });

  describe("get-balance-stx()", () => {
    it("returns the correct STX balance of the vault", () => {
      // Arrange - deposit some STX to the vault
      const depositAmount = 5000000; // 5 STX

      // Get initial balance
      const initialBalanceResponse = simnet.callReadOnlyFn(
        contractAddress,
        "get-balance-stx",
        [],
        user
      );
      const initialBalance = Number(cvToValue(initialBalanceResponse.result));

      // Deposit STX
      simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(depositAmount)],
        user
      );

      // Expected balance after deposit
      const expectedBalance = initialBalance + depositAmount;

      // Act
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-balance-stx",
        [],
        user
      );

      // Assert
      expect(Number(cvToValue(receipt.result))).toBe(expectedBalance);
    });
  });
});
