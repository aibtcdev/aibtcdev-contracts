import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { UserAgentVaultErrCode } from "../error-codes";

// Define constants and accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user = accounts.get("wallet_1")!;
const agent = accounts.get("wallet_2")!;
const otherUser = accounts.get("wallet_3")!;

// Contract references
const contractName = "aibtc-user-agent-vault";
const contractAddress = `${deployer}.${contractName}`;
const sbtcTokenAddress = `${deployer}.sbtc-token`;
const daoTokenAddress = `${deployer}.aibtc-token`;

// Error codes
const ErrCode = UserAgentVaultErrCode;

// Helper function to check notification events
const getNotification = (receipt: any) => {
  const printEvent = receipt.events.find(
    (e: any) => e.event === "print_event"
  );
  if (!printEvent) return null;
  
  return cvToValue(printEvent.data.value);
};

describe(`contract: ${contractName}`, () => {
  // Asset Management Tests
  describe("deposit-stx()", () => {
    it("succeeds and deposits STX to the vault", () => {
      // Arrange
      const amount = 1000000; // 1 STX
      const initialBalance = simnet.getStxBalance(contractAddress);
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      const newBalance = simnet.getStxBalance(contractAddress);
      expect(newBalance).toBe(initialBalance + amount);
    });
    
    it("emits the correct notification event", () => {
      // Arrange
      const amount = 2000000; // 2 STX
      
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
      expect(notification.notification).toBe("deposit-stx");
      expect(notification.payload.amount).toBe(amount);
      expect(notification.payload.sender).toBe(user);
      expect(notification.payload.recipient).toBe(contractAddress);
    });
  });

  describe("deposit-ft()", () => {
    it("fails if asset is not approved", () => {
      // Arrange
      const amount = 1000;
      const unapprovedToken = `${deployer}.unapproved-token`;
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.contractPrincipal(deployer, "unapproved-token"), Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
    });
    
    it("succeeds and transfers FT to vault", () => {
      // Arrange
      const amount = 1000;
      
      // Mock the token transfer
      const mockTransferFn = simnet.stubContract(
        sbtcTokenAddress,
        "transfer",
        Cl.ok(Cl.bool(true))
      );
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.contractPrincipal(deployer, "sbtc-token"), Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      expect(mockTransferFn).toHaveBeenCalledWith(
        Cl.uint(amount),
        Cl.principal(user),
        Cl.principal(contractAddress),
        Cl.none()
      );
    });
    
    it("emits the correct notification event", () => {
      // Arrange
      const amount = 2000;
      
      // Mock the token transfer
      simnet.stubContract(
        sbtcTokenAddress,
        "transfer",
        Cl.ok(Cl.bool(true))
      );
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.contractPrincipal(deployer, "sbtc-token"), Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("deposit-ft");
      expect(notification.payload.amount).toBe(amount);
      expect(notification.payload.assetContract).toBe(`${deployer}.sbtc-token`);
      expect(notification.payload.sender).toBe(user);
      expect(notification.payload.recipient).toBe(contractAddress);
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
      const initialUserBalance = simnet.getStxBalance(user);
      const initialVaultBalance = simnet.getStxBalance(contractAddress);
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      const newUserBalance = simnet.getStxBalance(user);
      const newVaultBalance = simnet.getStxBalance(contractAddress);
      
      // Account for transaction fees
      expect(newUserBalance).toBeGreaterThan(initialUserBalance);
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
      expect(notification.notification).toBe("withdraw-stx");
      expect(notification.payload.amount).toBe(amount);
      expect(notification.payload.sender).toBe(contractAddress);
      expect(notification.payload.recipient).toBe(user);
    });
  });

  describe("withdraw-ft()", () => {
    beforeEach(() => {
      // Mock a deposit of tokens to the vault
      simnet.stubContract(
        sbtcTokenAddress,
        "transfer",
        Cl.ok(Cl.bool(true))
      );
      
      simnet.callPublicFn(
        contractAddress,
        "deposit-ft",
        [Cl.contractPrincipal(deployer, "sbtc-token"), Cl.uint(10000)],
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
        [Cl.contractPrincipal(deployer, "sbtc-token"), Cl.uint(amount)],
        agent
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
    
    it("fails if asset is not approved", () => {
      // Arrange
      const amount = 1000;
      const unapprovedToken = `${deployer}.unapproved-token`;
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.contractPrincipal(deployer, "unapproved-token"), Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
    });
    
    it("succeeds and transfers FT to the user", () => {
      // Arrange
      const amount = 1000;
      
      // Mock the token transfer
      const mockTransferFn = simnet.stubContract(
        sbtcTokenAddress,
        "transfer",
        Cl.ok(Cl.bool(true))
      );
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.contractPrincipal(deployer, "sbtc-token"), Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      expect(mockTransferFn).toHaveBeenCalledWith(
        Cl.uint(amount),
        Cl.principal(contractAddress),
        Cl.principal(user),
        Cl.none()
      );
    });
    
    it("emits the correct notification event", () => {
      // Arrange
      const amount = 2000;
      
      // Mock the token transfer
      simnet.stubContract(
        sbtcTokenAddress,
        "transfer",
        Cl.ok(Cl.bool(true))
      );
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.contractPrincipal(deployer, "sbtc-token"), Cl.uint(amount)],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("withdraw-ft");
      expect(notification.payload.amount).toBe(amount);
      expect(notification.payload.assetContract).toBe(`${deployer}.sbtc-token`);
      expect(notification.payload.sender).toBe(contractAddress);
      expect(notification.payload.recipient).toBe(user);
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
      
      expect(isApproved.result).toBe(Cl.bool(true));
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
      expect(notification.notification).toBe("approve-asset");
      expect(notification.payload.asset).toBe(newAsset);
      expect(notification.payload.approved).toBe(true);
      expect(notification.payload.sender).toBe(user);
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
      expect(isApproved.result).toBe(Cl.bool(true));
      
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
      expect(isApproved.result).toBe(Cl.bool(false));
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
      expect(notification.notification).toBe("revoke-asset");
      expect(notification.payload.asset).toBe(asset);
      expect(notification.payload.approved).toBe(false);
      expect(notification.payload.sender).toBe(user);
    });
  });

  // DAO Interaction Tests
  describe("proxy-propose-action()", () => {
    const actionProposalsAddress = `${deployer}.aibtc-action-proposals-v2`;
    const actionAddress = `${deployer}.aibtc-action-send-message`;
    const parameters = Cl.bufferFromAscii("test message");
    
    beforeEach(() => {
      // Mock the propose-action function to return a successful response
      simnet.stubContract(
        actionProposalsAddress,
        "propose-action",
        Cl.ok(Cl.uint(1))
      );
    });
    
    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters
        ],
        otherUser
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
    
    it("succeeds when called by the user", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("succeeds when called by the agent", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters
        ],
        agent
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("emits the correct notification event", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-propose-action",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message"),
          parameters
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("proxy-propose-action");
      expect(notification.payload["action-proposals"]).toBe(actionProposalsAddress);
      expect(notification.payload.action).toBe(actionAddress);
      expect(notification.payload.sender).toBe(user);
    });
  });

  describe("proxy-create-proposal()", () => {
    const coreProposalsAddress = `${deployer}.aibtc-core-proposals-v2`;
    const proposalAddress = `${deployer}.aibtc-base-enable-extension`;
    
    beforeEach(() => {
      // Mock the create-proposal function to return a successful response
      simnet.stubContract(
        coreProposalsAddress,
        "create-proposal",
        Cl.ok(Cl.uint(1))
      );
    });
    
    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        otherUser
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
    
    it("succeeds when called by the user", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.uint(1));
    });
    
    it("succeeds when called by the agent", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        agent
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.uint(1));
    });
    
    it("emits the correct notification event", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "proxy-create-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.uint(1));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("proxy-create-proposal");
      expect(notification.payload["core-proposals"]).toBe(coreProposalsAddress);
      expect(notification.payload.proposal).toBe(proposalAddress);
      expect(notification.payload.sender).toBe(user);
    });
  });

  describe("vote-on-action-proposal()", () => {
    const actionProposalsAddress = `${deployer}.aibtc-action-proposals-v2`;
    const proposalId = 1;
    const vote = true;
    
    beforeEach(() => {
      // Mock the vote-on-proposal function to return a successful response
      simnet.stubContract(
        actionProposalsAddress,
        "vote-on-proposal",
        Cl.ok(Cl.bool(true))
      );
    });
    
    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote)
        ],
        otherUser
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
    
    it("succeeds when called by the user", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote)
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("succeeds when called by the agent", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote)
        ],
        agent
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("emits the correct notification event", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.bool(vote)
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("vote-on-action-proposal");
      expect(notification.payload["action-proposals"]).toBe(actionProposalsAddress);
      expect(notification.payload.proposalId).toBe(proposalId);
      expect(notification.payload.vote).toBe(vote);
      expect(notification.payload.sender).toBe(user);
    });
  });

  describe("vote-on-core-proposal()", () => {
    const coreProposalsAddress = `${deployer}.aibtc-core-proposals-v2`;
    const proposalAddress = `${deployer}.aibtc-base-enable-extension`;
    const vote = true;
    
    beforeEach(() => {
      // Mock the vote-on-proposal function to return a successful response
      simnet.stubContract(
        coreProposalsAddress,
        "vote-on-proposal",
        Cl.ok(Cl.bool(true))
      );
    });
    
    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote)
        ],
        otherUser
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
    
    it("succeeds when called by the user", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote)
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("succeeds when called by the agent", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote)
        ],
        agent
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("emits the correct notification event", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension"),
          Cl.bool(vote)
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("vote-on-core-proposal");
      expect(notification.payload["core-proposals"]).toBe(coreProposalsAddress);
      expect(notification.payload.proposal).toBe(proposalAddress);
      expect(notification.payload.vote).toBe(vote);
      expect(notification.payload.sender).toBe(user);
    });
  });

  describe("conclude-action-proposal()", () => {
    const actionProposalsAddress = `${deployer}.aibtc-action-proposals-v2`;
    const actionAddress = `${deployer}.aibtc-action-send-message`;
    const proposalId = 1;
    
    beforeEach(() => {
      // Mock the conclude-proposal function to return a successful response
      simnet.stubContract(
        actionProposalsAddress,
        "conclude-proposal",
        Cl.ok(Cl.bool(true))
      );
    });
    
    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message")
        ],
        otherUser
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
    
    it("succeeds when called by the user", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message")
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("succeeds when called by the agent", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message")
        ],
        agent
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("emits the correct notification event", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-action-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-action-proposals-v2"),
          Cl.uint(proposalId),
          Cl.contractPrincipal(deployer, "aibtc-action-send-message")
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("conclude-action-proposal");
      expect(notification.payload["action-proposals"]).toBe(actionProposalsAddress);
      expect(notification.payload.proposalId).toBe(proposalId);
      expect(notification.payload.action).toBe(actionAddress);
      expect(notification.payload.sender).toBe(user);
    });
  });

  describe("conclude-core-proposal()", () => {
    const coreProposalsAddress = `${deployer}.aibtc-core-proposals-v2`;
    const proposalAddress = `${deployer}.aibtc-base-enable-extension`;
    
    beforeEach(() => {
      // Mock the conclude-proposal function to return a successful response
      simnet.stubContract(
        coreProposalsAddress,
        "conclude-proposal",
        Cl.ok(Cl.bool(true))
      );
    });
    
    it("fails if caller is not authorized (user or agent)", () => {
      // Act - call from unauthorized user
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        otherUser
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
    
    it("succeeds when called by the user", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("succeeds when called by the agent", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        agent
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
    });
    
    it("emits the correct notification event", () => {
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-core-proposal",
        [
          Cl.contractPrincipal(deployer, "aibtc-core-proposals-v2"),
          Cl.contractPrincipal(deployer, "aibtc-base-enable-extension")
        ],
        user
      );
      
      // Assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      
      const notification = getNotification(receipt);
      expect(notification).not.toBeNull();
      expect(notification.notification).toBe("conclude-core-proposal");
      expect(notification.payload["core-proposals"]).toBe(coreProposalsAddress);
      expect(notification.payload.proposal).toBe(proposalAddress);
      expect(notification.payload.sender).toBe(user);
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
      expect(receipt.result).toBe(Cl.bool(true));
      
      // Act - check DAO token (pre-approved in contract)
      const receipt2 = simnet.callReadOnlyFn(
        contractAddress,
        "is-approved-asset",
        [Cl.principal(daoTokenAddress)],
        user
      );
      
      // Assert
      expect(receipt2.result).toBe(Cl.bool(true));
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
      expect(receipt.result).toBe(Cl.bool(true));
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
      expect(receipt.result).toBe(Cl.bool(false));
    });
  });

  describe("get-balance-stx()", () => {
    it("returns the correct STX balance of the vault", () => {
      // Arrange - deposit some STX to the vault
      const depositAmount = 5000000; // 5 STX
      simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(depositAmount)],
        user
      );
      
      // Get the actual balance from simnet
      const expectedBalance = simnet.getStxBalance(contractAddress);
      
      // Act
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-balance-stx",
        [],
        user
      );
      
      // Assert
      expect(receipt.result).toBe(Cl.uint(expectedBalance));
    });
  });
});
