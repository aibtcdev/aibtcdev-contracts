import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ContractType } from "../../dao-types";
import { TreasuryErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = ContractType.DAO_TREASURY;
const contractAddress = `${deployer}.${contractName}`;
const ftContractAddress = `${deployer}.sip010-token`;

const ErrCode = TreasuryErrCode;

describe(`extension: ${contractName}`, () => {
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  describe("public functions", () => {
    it("allow-asset() fails if caller is not DAO or extension", () => {
      // Arrange
      const asset = address1;
      const enabled = true;
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "allow-asset",
        [Cl.principal(asset), Cl.bool(enabled)],
        address2 // Unauthorized caller
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("allow-assets() fails if caller is not DAO or extension", () => {
      // Arrange
      const allowList = [
        { token: address1, enabled: true },
        { token: address2, enabled: false }
      ];
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "allow-assets",
        [Cl.list(allowList.map(item => 
          Cl.tuple({
            "token": Cl.principal(item.token),
            "enabled": Cl.bool(item.enabled)
          })
        ))],
        address2 // Unauthorized caller
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("withdraw-stx() fails if caller is not DAO or extension", () => {
      // Arrange
      const amount = 1000;
      const recipient = address1;
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [Cl.uint(amount), Cl.principal(recipient)],
        address2 // Unauthorized caller
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("withdraw-ft() fails if caller is not DAO or extension", () => {
      // Arrange
      const amount = 1000;
      const recipient = address1;
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-ft",
        [Cl.contractPrincipal(deployer, "sip010-token"), Cl.uint(amount), Cl.principal(recipient)],
        address2 // Unauthorized caller
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("withdraw-nft() fails if caller is not DAO or extension", () => {
      // Arrange
      const tokenId = 1;
      const recipient = address1;
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "withdraw-nft",
        [Cl.contractPrincipal(deployer, "nft-trait"), Cl.uint(tokenId), Cl.principal(recipient)],
        address2 // Unauthorized caller
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("delegate-stx() fails if caller is not DAO or extension", () => {
      // Arrange
      const maxAmount = 1000;
      const delegateTo = address1;
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "delegate-stx",
        [Cl.uint(maxAmount), Cl.principal(delegateTo)],
        address2 // Unauthorized caller
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("revoke-delegate-stx() fails if caller is not DAO or extension", () => {
      // Arrange - No specific arrangement needed
      
      // Act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "revoke-delegate-stx",
        [],
        address2 // Unauthorized caller
      );
      
      // Assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });
  });

  describe("read-only functions", () => {
    it("is-allowed-asset() returns false for non-allowed assets", () => {
      // Arrange
      const asset = address1;
      
      // Act
      const result = simnet.callReadOnlyFn(
        contractAddress,
        "is-allowed-asset",
        [Cl.principal(asset)],
        deployer
      );
      
      // Assert
      expect(result.result).toBe(Cl.bool(false));
    });

    it("get-allowed-asset() returns none for non-allowed assets", () => {
      // Arrange
      const asset = address1;
      
      // Act
      const result = simnet.callReadOnlyFn(
        contractAddress,
        "get-allowed-asset",
        [Cl.principal(asset)],
        deployer
      );
      
      // Assert
      expect(result.result).toBe(Cl.none());
    });
  });
});
