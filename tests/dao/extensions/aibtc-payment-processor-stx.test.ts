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

describe(`read-only functions with test data: aibtc-payment-processor-stx`, () => {
  // Helper function to mock DAO authorization and add a resource
  it("can add a resource when authorized as DAO", () => {
    // Mock the DAO authorization by temporarily replacing the is-dao-or-extension function
    const mockDaoCheck = simnet.patchContract(
      contractAddress,
      "(define-private (is-dao-or-extension) (ok true))"
    );

    // Add a resource
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
    expect(addResource.result).toBeOk(Cl.uint(1));

    // Verify resource was added
    const getTotalResources = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-resources",
      [],
      deployer
    ).result;
    expect(getTotalResources).toStrictEqual(Cl.uint(1));

    // Restore the original contract
    mockDaoCheck.restore();
  });

  // Test resource-related functions with existing resource
  it("get-resource-index() returns the correct index for existing resource", () => {
    const getResourceIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-index",
      [Cl.stringUtf8(resourceName)],
      deployer
    ).result;
    expect(getResourceIndex).toStrictEqual(Cl.some(Cl.uint(1)));
  });

  it("get-resource() returns the correct data for existing resource", () => {
    const getResource = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource",
      [Cl.uint(1)],
      deployer
    ).result;

    // Check that we got a resource back
    expect(getResource).not.toBeNone();
    
    // Verify resource data
    const resourceData = getResource as any;
    expect(resourceData.value.name.value).toBe(resourceName);
    expect(resourceData.value.description.value).toBe(resourceDescription);
    expect(resourceData.value.price).toStrictEqual(Cl.uint(resourcePrice));
    expect(resourceData.value.enabled).toStrictEqual(Cl.bool(true));
    expect(resourceData.value.url).toStrictEqual(Cl.some(Cl.stringUtf8(resourceUrl)));
  });

  it("get-resource-by-name() returns the correct data for existing resource", () => {
    const getResourceByName = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-by-name",
      [Cl.stringUtf8(resourceName)],
      deployer
    ).result;

    // Check that we got a resource back
    expect(getResourceByName).not.toBeNone();
    
    // Verify resource data
    const resourceData = getResourceByName as any;
    expect(resourceData.value.name.value).toBe(resourceName);
    expect(resourceData.value.description.value).toBe(resourceDescription);
    expect(resourceData.value.price).toStrictEqual(Cl.uint(resourcePrice));
    expect(resourceData.value.enabled).toStrictEqual(Cl.bool(true));
  });

  // Create a user by paying an invoice
  it("can create a user by paying an invoice", () => {
    // Fund the user with STX
    simnet.mineBlock([
      simnet.mintStx(resourcePrice * 2, address1),
    ]);

    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));

    // Verify invoice was created
    const getTotalInvoices = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-invoices",
      [],
      deployer
    ).result;
    expect(getTotalInvoices).toStrictEqual(Cl.uint(1));

    // Verify user was created
    const getTotalUsers = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-users",
      [],
      deployer
    ).result;
    expect(getTotalUsers).toStrictEqual(Cl.uint(1));
  });

  // Test user-related functions with existing user
  it("get-user-index() returns the correct index for existing user", () => {
    const getUserIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(getUserIndex).toStrictEqual(Cl.some(Cl.uint(1)));
  });

  it("get-user-data() returns the correct data for existing user", () => {
    const getUserData = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data",
      [Cl.uint(1)],
      deployer
    ).result;

    // Check that we got user data back
    expect(getUserData).not.toBeNone();
    
    // Verify user data
    const userData = getUserData as any;
    expect(userData.value.address).toStrictEqual(Cl.principal(address1));
    expect(userData.value.totalSpent).toStrictEqual(Cl.uint(resourcePrice));
    expect(userData.value.totalUsed).toStrictEqual(Cl.uint(1));
  });

  it("get-user-data-by-address() returns the correct data for existing user", () => {
    const getUserDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;

    // Check that we got user data back
    expect(getUserDataByAddress).not.toBeNone();
    
    // Verify user data
    const userData = getUserDataByAddress as any;
    expect(userData.value.address).toStrictEqual(Cl.principal(address1));
    expect(userData.value.totalSpent).toStrictEqual(Cl.uint(resourcePrice));
    expect(userData.value.totalUsed).toStrictEqual(Cl.uint(1));
  });

  // Test invoice-related functions with existing invoice
  it("get-invoice() returns the correct data for existing invoice", () => {
    const getInvoice = simnet.callReadOnlyFn(
      contractAddress,
      "get-invoice",
      [Cl.uint(1)],
      deployer
    ).result;

    // Check that we got invoice data back
    expect(getInvoice).not.toBeNone();
    
    // Verify invoice data
    const invoiceData = getInvoice as any;
    expect(invoiceData.value.amount).toStrictEqual(Cl.uint(resourcePrice));
    expect(invoiceData.value.userIndex).toStrictEqual(Cl.uint(1));
    expect(invoiceData.value.resourceIndex).toStrictEqual(Cl.uint(1));
    expect(invoiceData.value.resourceName.value).toBe(resourceName);
  });

  it("get-recent-payment() returns the correct invoice index for existing user/resource", () => {
    const getRecentPayment = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment",
      [Cl.uint(1), Cl.uint(1)],
      deployer
    ).result;
    expect(getRecentPayment).toStrictEqual(Cl.some(Cl.uint(1)));
  });

  it("get-recent-payment-data() returns the correct data for existing user/resource", () => {
    const getRecentPaymentData = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data",
      [Cl.uint(1), Cl.uint(1)],
      deployer
    ).result;

    // Check that we got invoice data back
    expect(getRecentPaymentData).not.toBeNone();
    
    // Verify invoice data
    const invoiceData = getRecentPaymentData as any;
    expect(invoiceData.value.amount).toStrictEqual(Cl.uint(resourcePrice));
    expect(invoiceData.value.userIndex).toStrictEqual(Cl.uint(1));
    expect(invoiceData.value.resourceIndex).toStrictEqual(Cl.uint(1));
    expect(invoiceData.value.resourceName.value).toBe(resourceName);
  });

  it("get-recent-payment-data-by-address() returns the correct data for existing user/resource", () => {
    const getRecentPaymentDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data-by-address",
      [Cl.stringUtf8(resourceName), Cl.principal(address1)],
      deployer
    ).result;

    // Check that we got invoice data back
    expect(getRecentPaymentDataByAddress).not.toBeNone();
    
    // Verify invoice data
    const invoiceData = getRecentPaymentDataByAddress as any;
    expect(invoiceData.value.amount).toStrictEqual(Cl.uint(resourcePrice));
    expect(invoiceData.value.userIndex).toStrictEqual(Cl.uint(1));
    expect(invoiceData.value.resourceIndex).toStrictEqual(Cl.uint(1));
    expect(invoiceData.value.resourceName.value).toBe(resourceName);
  });

  // Test total revenue after payment
  it("get-total-revenue() returns the correct total after payment", () => {
    const getTotalRevenue = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-revenue",
      [],
      deployer
    ).result;
    expect(getTotalRevenue).toStrictEqual(Cl.uint(resourcePrice));
  });

  // Test contract data after payment
  it("get-contract-data() returns updated contract data after payment", () => {
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
      totalInvoices: Cl.uint(1),
      totalResources: Cl.uint(1),
      totalRevenue: Cl.uint(resourcePrice),
      totalUsers: Cl.uint(1),
    });

    expect(getContractData).toStrictEqual(expectedData);
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

  /////////////////////////////////////////////
  // get-user-index() tests
  /////////////////////////////////////////////
  it("get-user-index() returns none for non-existent user", () => {
    const getUserIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(getUserIndex).toBeNone();
  });

  /////////////////////////////////////////////
  // get-user-data() tests
  /////////////////////////////////////////////
  it("get-user-data() returns none for non-existent user index", () => {
    const getUserData = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data",
      [Cl.uint(1)],
      deployer
    ).result;
    expect(getUserData).toBeNone();
  });

  /////////////////////////////////////////////
  // get-user-data-by-address() tests
  /////////////////////////////////////////////
  it("get-user-data-by-address() returns none for non-existent user", () => {
    const getUserDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(getUserDataByAddress).toBeNone();
  });

  /////////////////////////////////////////////
  // get-resource-index() tests
  /////////////////////////////////////////////
  it("get-resource-index() returns none for non-existent resource", () => {
    const getResourceIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-index",
      [Cl.stringUtf8(resourceName)],
      deployer
    ).result;
    expect(getResourceIndex).toBeNone();
  });

  /////////////////////////////////////////////
  // get-resource() tests
  /////////////////////////////////////////////
  it("get-resource() returns none for non-existent resource index", () => {
    const getResource = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource",
      [Cl.uint(1)],
      deployer
    ).result;
    expect(getResource).toBeNone();
  });

  /////////////////////////////////////////////
  // get-resource-by-name() tests
  /////////////////////////////////////////////
  it("get-resource-by-name() returns none for non-existent resource", () => {
    const getResourceByName = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-by-name",
      [Cl.stringUtf8(resourceName)],
      deployer
    ).result;
    expect(getResourceByName).toBeNone();
  });

  /////////////////////////////////////////////
  // get-invoice() tests
  /////////////////////////////////////////////
  it("get-invoice() returns none for non-existent invoice index", () => {
    const getInvoice = simnet.callReadOnlyFn(
      contractAddress,
      "get-invoice",
      [Cl.uint(1)],
      deployer
    ).result;
    expect(getInvoice).toBeNone();
  });

  /////////////////////////////////////////////
  // get-recent-payment() tests
  /////////////////////////////////////////////
  it("get-recent-payment() returns none for non-existent user/resource combination", () => {
    const getRecentPayment = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment",
      [Cl.uint(1), Cl.uint(1)],
      deployer
    ).result;
    expect(getRecentPayment).toBeNone();
  });

  /////////////////////////////////////////////
  // get-recent-payment-data() tests
  /////////////////////////////////////////////
  it("get-recent-payment-data() returns none for non-existent user/resource combination", () => {
    const getRecentPaymentData = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data",
      [Cl.uint(1), Cl.uint(1)],
      deployer
    ).result;
    expect(getRecentPaymentData).toBeNone();
  });

  /////////////////////////////////////////////
  // get-recent-payment-data-by-address() tests
  /////////////////////////////////////////////
  it("get-recent-payment-data-by-address() returns none for non-existent user/resource combination", () => {
    const getRecentPaymentDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data-by-address",
      [Cl.stringUtf8(resourceName), Cl.principal(address1)],
      deployer
    ).result;
    expect(getRecentPaymentDataByAddress).toBeNone();
  });
});
