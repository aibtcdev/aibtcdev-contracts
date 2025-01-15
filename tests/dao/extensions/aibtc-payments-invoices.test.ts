import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { PaymentsInvoicesErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-payments-invoices";
const contractAddress = `${deployer}.${contractName}`;

const ErrCode = PaymentsInvoicesErrCode;

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
  /*
  // Payment Address Tests
  describe("set-payment-address()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if old address matches current payment address");
    it("fails if old address and new address are the same");
    it("succeeds and sets the new payment address");
  });

  // Resource Tests
  describe("add-resource()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if name is blank");
    it("fails if description is blank");
    it("fails if price is 0");
    it("fails if provided url is blank");
    it("fails if resource name already used");
    it("succeeds and adds a new resource");
  });

  // Resource Toggle Tests
  describe("toggle-resource()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if resource is not found");
    it("fails if resource index is 0");
    it("succeeds and toggles if resource is enabled");
  });

  describe("toggle-resource-by-name()", () => {
    it("fails if caller is not DAO or extension");
    it("fails if resource is not found");
    it("succeeds and toggles if resource is enabled");
  });

  // Invoice Tests
  describe("pay-invoice()", () => {
    it("fails if resource is not found");
    it("fails if resource index is 0");
    it("fails if resource is disabled");
    it("succeeds and updates info for resource");
  });

  describe("pay-invoice-by-resource-name()", () => {
    it("fails if resource is not found");
    it("fails if resource is disabled");
    it("succeeds and updates info for resource");
  });
  */
});
