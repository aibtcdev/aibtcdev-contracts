import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { PaymentsInvoicesErrCode } from "../../error-codes";
import { ContractType } from "../../dao-types";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.aibtc-payment-processor-stx`;

const ErrCode = PaymentsInvoicesErrCode;

// Test resource data
const resourceName = "test-resource";
const resourceDescription = "Test resource description";
const resourcePrice = 10000000; // 10 STX
const resourceUrl = "https://example.com/resource";

describe(`public functions: aibtc-payment-processor-stx`, () => {
  ////////////////////////////////////////
  // callback() tests
  ////////////////////////////////////////
  it("callback() should respond with (ok true)", () => {
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // set-payment-address() tests
  ////////////////////////////////////////
  it("set-payment-address() fails if called directly", () => {
    const setPaymentAddress = simnet.callPublicFn(
      contractAddress,
      "set-payment-address",
      [Cl.principal(address1)],
      deployer
    );
    expect(setPaymentAddress.result).toBeErr(
      Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION)
    );
  });

  ////////////////////////////////////////
  // add-resource() tests
  ////////////////////////////////////////
  it("add-resource() fails if called directly", () => {
    const addResource = simnet.callPublicFn(
      contractAddress,
      "add-resource",
      [
        Cl.stringUtf8(resourceName),
        Cl.stringUtf8(resourceDescription),
        Cl.uint(resourcePrice),
        Cl.some(Cl.stringUtf8(resourceUrl)),
      ],
      deployer
    );
    expect(addResource.result).toBeErr(
      Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION)
    );
  });

  ////////////////////////////////////////
  // toggle-resource() tests
  ////////////////////////////////////////
  it("toggle-resource() fails if called directly", () => {
    // NOTE: full check would pass and add one first
    const toggleResource = simnet.callPublicFn(
      contractAddress,
      "toggle-resource",
      [Cl.uint(1)],
      deployer
    );
    expect(toggleResource.result).toBeErr(
      Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND)
    );
  });

  ////////////////////////////////////////
  // toggle-resource-by-name() tests
  ////////////////////////////////////////
  it("toggle-resource-by-name() fails if called directly", () => {
    // NOTE: full check would pass and add one first
    const toggleResourceByName = simnet.callPublicFn(
      contractAddress,
      "toggle-resource-by-name",
      [Cl.stringUtf8(resourceName)],
      deployer
    );
    expect(toggleResourceByName.result).toBeErr(
      Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND)
    );
  });

  ////////////////////////////////////////
  // pay-invoice() tests
  ////////////////////////////////////////
  it("pay-invoice() fails if resource is not found", () => {
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeErr(Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND));
  });

  it("pay-invoice() fails if resource index is 0", () => {
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(0), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeErr(Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND));
  });

  ////////////////////////////////////////
  // pay-invoice-by-resource-name() tests
  ////////////////////////////////////////
  it("pay-invoice-by-resource-name() fails if resource is not found", () => {
    const payInvoiceByName = simnet.callPublicFn(
      contractAddress,
      "pay-invoice-by-resource-name",
      [Cl.stringUtf8(resourceName), Cl.none()],
      address1
    );
    expect(payInvoiceByName.result).toBeErr(
      Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND)
    );
  });
});

describe(`read-only functions: aibtc-payment-processor-stx`, () => {
  /////////////////////////////////////////////
  // get-total-users() tests
  /////////////////////////////////////////////
  it("get-total-users() returns the total number of users", () => {
    const getTotalUsers = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-users",
      [],
      deployer
    ).result;
    expect(getTotalUsers).toStrictEqual(Cl.uint(0));
  });

  /////////////////////////////////////////////
  // get-total-resources() tests
  /////////////////////////////////////////////
  it("get-total-resources() returns the total number of resources", () => {
    const getTotalResources = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-resources",
      [],
      deployer
    ).result;
    expect(getTotalResources).toStrictEqual(Cl.uint(0));
  });

  /////////////////////////////////////////////
  // get-total-invoices() tests
  /////////////////////////////////////////////
  it("get-total-invoices() returns the total number of invoices", () => {
    const getTotalInvoices = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-invoices",
      [],
      deployer
    ).result;
    expect(getTotalInvoices).toStrictEqual(Cl.uint(0));
  });

  /////////////////////////////////////////////
  // get-payment-address() tests
  /////////////////////////////////////////////
  it("get-payment-address() returns the payment address", () => {
    const getPaymentAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-payment-address",
      [],
      deployer
    ).result;
    // Default payment address should be the treasury
    expect(getPaymentAddress).toStrictEqual(
      Cl.some(Cl.principal(`${deployer}.aibtc-treasury`))
    );
  });

  /////////////////////////////////////////////
  // get-total-revenue() tests
  /////////////////////////////////////////////
  it("get-total-revenue() returns the total revenue", () => {
    const getTotalRevenue = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-revenue",
      [],
      deployer
    ).result;
    expect(getTotalRevenue).toStrictEqual(Cl.uint(0));
  });

  /////////////////////////////////////////////
  // get-contract-data() tests
  /////////////////////////////////////////////
  it("get-contract-data() returns the contract data", () => {
    const getContractData = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-data",
      [],
      deployer
    ).result;

    const expectedData = Cl.tuple({
      contractAddress: Cl.principal(contractAddress),
      paymentAddress: Cl.some(Cl.principal(`${deployer}.aibtc-treasury`)),
      paymentToken: Cl.stringAscii("STX"),
      totalInvoices: Cl.uint(0),
      totalResources: Cl.uint(0),
      totalRevenue: Cl.uint(0),
      totalUsers: Cl.uint(0),
    });

    expect(getContractData).toStrictEqual(expectedData);
  });
});
