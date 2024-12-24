import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

const contractAddress = `${addressDeployer}.aibtcdev-bank-account`;

enum ErrCode {
  ERR_INVALID = 1000,
  ERR_UNAUTHORIZED = 1001,
  ERR_TOO_SOON = 1002,
}

const withdrawalAmount = 10000000;
const withdrawalPeriod = 144;

describe("aibtc-ext002-bank-account", () => {
  describe("set-account-holder", () => {
    it("succeeds when deployer sets a valid account holder", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(address1)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("succeeds when deployer sets a valid account holder a second time", () => {
      simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(address1)],
        addressDeployer
      );
      const response = simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(address2)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-deployer tries to set the account holder", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(address1)],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails if the deployer tries to set an invalid account holder", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(contractAddress)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });

    it("succeeds when deployer sets a contract principal as account holder", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(`${addressDeployer}.test-proxy`)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });
  });

  describe("set-withdrawal-period", () => {
    it("succeeds when deployer sets a valid period", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-withdrawal-period",
        [Cl.uint(200)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-deployer tries to set the period", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-withdrawal-period",
        [Cl.uint(200)],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when deployer sets an invalid period", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-withdrawal-period",
        [Cl.uint(0)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });
  });

  describe("set-withdrawal-amount", () => {
    it("succeeds when deployer sets a valid amount", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-withdrawal-amount",
        [Cl.uint(15000000)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-deployer tries to set the amount", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-withdrawal-amount",
        [Cl.uint(15000000)],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when deployer sets an invalid amount", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "set-withdrawal-amount",
        [Cl.uint(0)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });
  });

  describe("override-last-withdrawal-block", () => {
    it("succeeds when deployer sets a valid block height", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "override-last-withdrawal-block",
        [Cl.uint(500)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-deployer tries to set the block height", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "override-last-withdrawal-block",
        [Cl.uint(500)],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when deployer sets an invalid block height", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "override-last-withdrawal-block",
        [Cl.uint(0)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });

    it("fails when deployer sets a block height less than deployed height", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "override-last-withdrawal-block",
        [Cl.uint(1)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });
  });

  describe("deposit-stx", () => {
    it("succeeds when user deposits STX into the contract", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(10000000)],
        address1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });
  });

  describe("withdraw-stx", () => {
    it("succeeds when an authorized user withdraws STX", () => {
      // arrange
      simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(100000000)],
        address1
      );
      simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(address1)],
        addressDeployer
      );
      simnet.mineEmptyBlocks(200);
      const response = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [],
        address1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-authorized user tries to withdraw", () => {
      const response = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [],
        address2
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when the user tries to withdraw too soon", () => {
      simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(address1)],
        addressDeployer
      );
      simnet.callPublicFn(
        contractAddress,
        "override-last-withdrawal-block",
        [Cl.uint(simnet.blockHeight)],
        addressDeployer
      );
      const response = simnet.callPublicFn(
        contractAddress,
        "withdraw-stx",
        [],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_TOO_SOON));
    });
  });

  describe("get-account-balance", () => {
    it("succeeds and returns the contract balance", () => {
      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-account-balance",
        [],
        addressDeployer
      );
      expect(response.result).toBeUint(0);
    });

    it("succeeds and returns the contract balance after deposit", () => {
      simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(100000000)],
        address1
      );
      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-account-balance",
        [],
        addressDeployer
      );
      expect(response.result).toBeUint(100000000);
    });
  });

  describe("get-withdrawal-period", () => {
    it("succeeds and returns the withdrawal period", () => {
      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-withdrawal-period",
        [],
        address1
      );
      expect(response.result).toBeUint(withdrawalPeriod);
    });
  });

  describe("get-withdrawal-amount", () => {
    it("succeeds and returns the withdrawal amount", () => {
      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-withdrawal-amount",
        [],
        address1
      );
      expect(response.result).toBeUint(withdrawalAmount);
    });
  });

  describe("get-last-withdrawal-block", () => {
    it("succeeds and returns the last withdrawal block", () => {
      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-last-withdrawal-block",
        [],
        address1
      );
      expect(response.result).toBeUint(0);
    });
  });

  describe("get-account-terms", () => {
    it("succeeds and returns all account terms", () => {
      // First set up some state
      simnet.callPublicFn(
        contractAddress,
        "deposit-stx",
        [Cl.uint(100000000)],
        address1
      );
      simnet.callPublicFn(
        contractAddress,
        "set-account-holder",
        [Cl.principal(address1)],
        addressDeployer
      );

      const expectedResponse = {
        accountBalance: Cl.uint(100000000),
        accountHolder: Cl.principal(address1),
        contractName: Cl.principal(contractAddress),
        deployedAt: Cl.uint(0), // In test environment this is 0
        lastWithdrawalBlock: Cl.uint(0),
        withdrawalAmount: Cl.uint(withdrawalAmount),
        withdrawalPeriod: Cl.uint(withdrawalPeriod),
      };

      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-account-terms",
        [],
        address1
      ).result;

      expect(response).toBeTuple(expectedResponse);
    });
  });

  describe("get-all-vars", () => {
    it("succeeds and returns all the variables", () => {
      const expectedResponse = {
        withdrawalPeriod: Cl.uint(withdrawalPeriod),
        withdrawalAmount: Cl.uint(withdrawalAmount),
        lastWithdrawalBlock: Cl.uint(0),
      };

      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-all-vars",
        [],
        address1
      ).result;

      expect(response).toBeTuple(expectedResponse);
    });
  });

  describe("get-standard-caller", () => {
    it("succeeds and returns the caller", () => {
      const response = simnet.callReadOnlyFn(
        contractAddress,
        "get-standard-caller",
        [],
        address1
      );
      expect(response.result).toBePrincipal(address1);
    });

    it("succeeds and returns the caller with a proxy", () => {
      const response = simnet.callPublicFn(
        "test-proxy",
        "get-standard-caller",
        [],
        address1
      );
      expect(response.result).toBeOk(Cl.principal(addressDeployer));
    });
  });
});
