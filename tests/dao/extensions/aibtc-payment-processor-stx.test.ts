import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { PaymentsInvoicesErrCode } from "../../error-codes";
import { ContractType, ContractProposalType } from "../../dao-types";
import {
  constructDao,
  fundVoters,
  passCoreProposal,
  VOTING_CONFIG,
} from "../../test-utilities";

// Contract names for reuse
const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractAddress = `${deployer}.${ContractType.DAO_PAYMENT_PROCESSOR_STX}`;
const tokenContractAddress = `${deployer}.${ContractType.DAO_TOKEN}`;
const tokenDexContractAddress = `${deployer}.${ContractType.DAO_TOKEN_DEX}`;
const baseDaoContractAddress = `${deployer}.${ContractType.DAO_BASE}`;
const bootstrapContractAddress = `${deployer}.${ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2}`;
const coreProposalsContractAddress = `${deployer}.${ContractType.DAO_CORE_PROPOSALS_V2}`;
const proposalContractAddress = `${deployer}.${ContractProposalType.DAO_PAYMENTS_STX_ADD_RESOURCE}`;

const ErrCode = PaymentsInvoicesErrCode;

// Test resource data
const resourceName = "test-resource";
const resourceDescription = "Test resource description";
const resourcePrice = 10000000; // 10 STX
const resourceUrl = "https://example.com/resource";

// Helper function to set up a test with a resource and optionally a user
function setupTest(createUser = false) {
  // Setup voting config
  const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

  // Fund accounts for creating and voting on proposals
  fundVoters(tokenContractAddress, tokenDexContractAddress, [
    deployer,
    address1,
    address2,
  ]);

  // Construct DAO
  const constructReceipt = constructDao(
    deployer,
    baseDaoContractAddress,
    bootstrapContractAddress
  );
  expect(constructReceipt.result).toBeOk(Cl.bool(true));

  // Pass proposal to add resource
  const concludeProposalReceipt = passCoreProposal(
    coreProposalsContractAddress,
    proposalContractAddress,
    deployer,
    [deployer, address1, address2],
    votingConfig
  );
  expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

  if (createUser) {
    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));
  }
}

describe(`public functions: ${ContractType.DAO_PAYMENT_PROCESSOR_STX}`, () => {
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

describe(`read-only functions: ${ContractType.DAO_PAYMENT_PROCESSOR_STX}`, () => {
  /////////////////////////////////////////////
  // get-total-users() tests
  /////////////////////////////////////////////
  it("get-total-users() returns the total number of users before any are created", () => {
    const getTotalUsers = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-users",
      [],
      deployer
    ).result;
    expect(getTotalUsers).toStrictEqual(Cl.uint(0));
  });

  it("get-total-users() returns the correct count after a user is created", () => {
    // Arrange
    // Setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

    // Fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // Construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // Pass proposal to add resource
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));

    // Act
    const getTotalUsers = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-users",
      [],
      deployer
    ).result;

    // Assert
    expect(getTotalUsers).toStrictEqual(Cl.uint(1));
  });

  /////////////////////////////////////////////
  // get-total-resources() tests
  /////////////////////////////////////////////
  it("get-total-resources() returns the total number of resources before any are created", () => {
    const getTotalResources = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-resources",
      [],
      deployer
    ).result;
    expect(getTotalResources).toStrictEqual(Cl.uint(0));
  });

  it("get-total-resources() returns the correct count after a resource is added", () => {
    // Arrange
    // Setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

    // Fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // Construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // Pass proposal to add resource
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // Act
    const getTotalResources = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-resources",
      [],
      deployer
    ).result;

    // Assert
    expect(getTotalResources).toStrictEqual(Cl.uint(1));
  });

  /////////////////////////////////////////////
  // get-total-invoices() tests
  /////////////////////////////////////////////
  it("get-total-invoices() returns the total number of invoices before any are created", () => {
    const getTotalInvoices = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-invoices",
      [],
      deployer
    ).result;
    expect(getTotalInvoices).toStrictEqual(Cl.uint(0));
  });

  it("get-total-invoices() returns the correct count after an invoice is created", () => {
    // Arrange
    // Setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

    // Fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // Construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // Pass proposal to add resource
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));

    // Act
    const getTotalInvoices = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-invoices",
      [],
      deployer
    ).result;

    // Assert
    expect(getTotalInvoices).toStrictEqual(Cl.uint(1));
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
    expect(getPaymentAddress).toBeSome(
      Cl.principal(`${deployer}.aibtc-treasury`)
    );
  });

  /////////////////////////////////////////////
  // get-total-revenue() tests
  /////////////////////////////////////////////
  it("get-total-revenue() returns zero before any payments", () => {
    const getTotalRevenue = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-revenue",
      [],
      deployer
    ).result;
    expect(getTotalRevenue).toStrictEqual(Cl.uint(0));
  });

  it("get-total-revenue() returns the correct total after payment", () => {
    // Arrange
    // Setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

    // Fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // Construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // Pass proposal to add resource
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));

    // Act
    const getTotalRevenue = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-revenue",
      [],
      deployer
    ).result;

    // Assert
    expect(getTotalRevenue).toStrictEqual(Cl.uint(resourcePrice));
  });

  /////////////////////////////////////////////
  // get-contract-data() tests
  /////////////////////////////////////////////
  it("get-contract-data() returns the initial contract data", () => {
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

  it("get-contract-data() returns updated contract data after payment", () => {
    // Arrange
    // Setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

    // Fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // Construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // Pass proposal to add resource
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));

    // Act
    const getContractData = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-data",
      [],
      deployer
    ).result;

    // Assert
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

  /////////////////////////////////////////////
  // get-user-index() tests
  /////////////////////////////////////////////
  it("get-user-index() returns none for non-existent user", () => {
    const getUserIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address2)],
      deployer
    ).result;
    expect(getUserIndex).toBeNone();
  });

  it("get-user-index() returns the correct index for existing user", () => {
    // Arrange
    // Setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

    // Fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // Construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // Pass proposal to add resource
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));

    // Act
    const getUserIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address1)],
      deployer
    ).result;

    // Assert
    expect(getUserIndex).toBeSome(Cl.uint(1));
  });

  /////////////////////////////////////////////
  // get-user-data() tests
  /////////////////////////////////////////////
  it("get-user-data() returns none for non-existent user index", () => {
    const getUserData = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data",
      [Cl.uint(999)],
      deployer
    ).result;
    expect(getUserData).toBeNone();
  });

  it("get-user-data() returns the correct data for existing user", () => {
    // Arrange
    // Setup voting config
    const votingConfig = VOTING_CONFIG[ContractType.DAO_CORE_PROPOSALS_V2];

    // Fund accounts for creating and voting on proposals
    fundVoters(tokenContractAddress, tokenDexContractAddress, [
      deployer,
      address1,
      address2,
    ]);

    // Construct DAO
    const constructReceipt = constructDao(
      deployer,
      baseDaoContractAddress,
      bootstrapContractAddress
    );
    expect(constructReceipt.result).toBeOk(Cl.bool(true));

    // Pass proposal to add resource
    const concludeProposalReceipt = passCoreProposal(
      coreProposalsContractAddress,
      proposalContractAddress,
      deployer,
      [deployer, address1, address2],
      votingConfig
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // Pay an invoice
    const payInvoice = simnet.callPublicFn(
      contractAddress,
      "pay-invoice",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(payInvoice.result).toBeOk(Cl.uint(1));

    // Act
    const getUserData = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data",
      [Cl.uint(1)],
      deployer
    ).result;

    // Assert
    expect(getUserData).toBeSome();
    
    const expectedUserData = Cl.tuple({
      address: Cl.principal(address1),
      totalSpent: Cl.uint(resourcePrice),
      totalUsed: Cl.uint(1)
    });
    
    expect(getUserData).toBeSome(expectedUserData);
  });

  /////////////////////////////////////////////
  // get-user-data-by-address() tests
  /////////////////////////////////////////////
  it("get-user-data-by-address() returns none for non-existent user", () => {
    const getUserDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address2)],
      deployer
    ).result;
    expect(getUserDataByAddress).toBeNone();
  });

  it("get-user-data-by-address() returns the correct data for existing user", () => {
    // Arrange
    setupTest(true);

    // Act
    const getUserDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;

    // Assert
    expect(getUserDataByAddress).toBeSome();
    
    const expectedUserData = Cl.tuple({
      address: Cl.principal(address1),
      totalSpent: Cl.uint(resourcePrice),
      totalUsed: Cl.uint(1)
    });
    
    expect(getUserDataByAddress).toBeSome(expectedUserData);
  });

  /////////////////////////////////////////////
  // get-resource-index() tests
  /////////////////////////////////////////////
  it("get-resource-index() returns none for non-existent resource", () => {
    const getResourceIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-index",
      [Cl.stringUtf8("non-existent-resource")],
      deployer
    ).result;
    expect(getResourceIndex).toBeNone();
  });

  it("get-resource-index() returns the correct index for existing resource", () => {
    // Arrange
    setupTest(false);

    // Act
    const getResourceIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-index",
      [Cl.stringUtf8(resourceName)],
      deployer
    ).result;

    // Assert
    expect(getResourceIndex).toBeSome(Cl.uint(1));
  });

  /////////////////////////////////////////////
  // get-resource() tests
  /////////////////////////////////////////////
  it("get-resource() returns none for non-existent resource index", () => {
    const getResource = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource",
      [Cl.uint(999)],
      deployer
    ).result;
    expect(getResource).toBeNone();
  });

  it("get-resource() returns the correct data for existing resource", () => {
    // Arrange
    setupTest(false);

    // Act
    const getResource = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource",
      [Cl.uint(1)],
      deployer
    ).result;

    // Assert
    expect(getResource).toBeSome();
    
    const expectedResourceData = Cl.tuple({
      name: Cl.stringUtf8(resourceName),
      description: Cl.stringUtf8(resourceDescription),
      price: Cl.uint(resourcePrice),
      enabled: Cl.bool(true),
      url: Cl.some(Cl.stringUtf8(resourceUrl)),
      createdAt: (getResource as any).value.createdAt,
      totalSpent: Cl.uint(0),
      totalUsed: Cl.uint(0)
    });
    
    expect(getResource).toBeSome(expectedResourceData);
  });

  /////////////////////////////////////////////
  // get-resource-by-name() tests
  /////////////////////////////////////////////
  it("get-resource-by-name() returns none for non-existent resource", () => {
    const getResourceByName = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-by-name",
      [Cl.stringUtf8("non-existent-resource")],
      deployer
    ).result;
    expect(getResourceByName).toBeNone();
  });

  it("get-resource-by-name() returns the correct data for existing resource", () => {
    // Arrange
    setupTest(false);

    // Act
    const getResourceByName = simnet.callReadOnlyFn(
      contractAddress,
      "get-resource-by-name",
      [Cl.stringUtf8(resourceName)],
      deployer
    ).result;

    // Assert
    expect(getResourceByName).toBeSome();
    
    const expectedResourceData = Cl.tuple({
      name: Cl.stringUtf8(resourceName),
      description: Cl.stringUtf8(resourceDescription),
      price: Cl.uint(resourcePrice),
      enabled: Cl.bool(true),
      url: Cl.some(Cl.stringUtf8(resourceUrl)),
      createdAt: (getResourceByName as any).value.createdAt,
      totalSpent: Cl.uint(0),
      totalUsed: Cl.uint(0)
    });
    
    expect(getResourceByName).toBeSome(expectedResourceData);
  });

  /////////////////////////////////////////////
  // get-invoice() tests
  /////////////////////////////////////////////
  it("get-invoice() returns none for non-existent invoice index", () => {
    const getInvoice = simnet.callReadOnlyFn(
      contractAddress,
      "get-invoice",
      [Cl.uint(999)],
      deployer
    ).result;
    expect(getInvoice).toBeNone();
  });

  it("get-invoice() returns the correct data for existing invoice", () => {
    // Arrange
    setupTest(true);

    // Act
    const getInvoice = simnet.callReadOnlyFn(
      contractAddress,
      "get-invoice",
      [Cl.uint(1)],
      deployer
    ).result;

    // Assert
    expect(getInvoice).toBeSome();
    
    const expectedInvoiceData = Cl.tuple({
      amount: Cl.uint(resourcePrice),
      userIndex: Cl.uint(1),
      resourceIndex: Cl.uint(1),
      resourceName: Cl.stringUtf8(resourceName),
      createdAt: (getInvoice as any).value.createdAt
    });
    
    expect(getInvoice).toBeSome(expectedInvoiceData);
  });

  /////////////////////////////////////////////
  // get-recent-payment() tests
  /////////////////////////////////////////////
  it("get-recent-payment() returns none for non-existent user/resource combination", () => {
    const getRecentPayment = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment",
      [Cl.uint(999), Cl.uint(999)],
      deployer
    ).result;
    expect(getRecentPayment).toBeNone();
  });

  it("get-recent-payment() returns the correct invoice index for existing user/resource", () => {
    // Arrange
    setupTest(true);

    // Act
    const getRecentPayment = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment",
      [Cl.uint(1), Cl.uint(1)],
      deployer
    ).result;

    // Assert
    expect(getRecentPayment).toBeSome(Cl.uint(1));
  });

  /////////////////////////////////////////////
  // get-recent-payment-data() tests
  /////////////////////////////////////////////
  it("get-recent-payment-data() returns none for non-existent user/resource combination", () => {
    const getRecentPaymentData = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data",
      [Cl.uint(999), Cl.uint(999)],
      deployer
    ).result;
    expect(getRecentPaymentData).toBeNone();
  });

  it("get-recent-payment-data() returns the correct data for existing user/resource", () => {
    // Arrange
    setupTest(true);

    // Act
    const getRecentPaymentData = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data",
      [Cl.uint(1), Cl.uint(1)],
      deployer
    ).result;

    // Assert
    expect(getRecentPaymentData).toBeSome();
    
    const expectedInvoiceData = Cl.tuple({
      amount: Cl.uint(resourcePrice),
      userIndex: Cl.uint(1),
      resourceIndex: Cl.uint(1),
      resourceName: Cl.stringUtf8(resourceName),
      createdAt: (getRecentPaymentData as any).value.createdAt
    });
    
    expect(getRecentPaymentData).toBeSome(expectedInvoiceData);
  });

  /////////////////////////////////////////////
  // get-recent-payment-data-by-address() tests
  /////////////////////////////////////////////
  it("get-recent-payment-data-by-address() returns none for non-existent user/resource combination", () => {
    const getRecentPaymentDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data-by-address",
      [Cl.stringUtf8("non-existent-resource"), Cl.principal(address2)],
      deployer
    ).result;
    expect(getRecentPaymentDataByAddress).toBeNone();
  });

  it("get-recent-payment-data-by-address() returns the correct data for existing user/resource", () => {
    // Arrange
    setupTest(true);

    // Act
    const getRecentPaymentDataByAddress = simnet.callReadOnlyFn(
      contractAddress,
      "get-recent-payment-data-by-address",
      [Cl.stringUtf8(resourceName), Cl.principal(address1)],
      deployer
    ).result;

    // Assert
    expect(getRecentPaymentDataByAddress).toBeSome();
    
    const expectedInvoiceData = Cl.tuple({
      amount: Cl.uint(resourcePrice),
      userIndex: Cl.uint(1),
      resourceIndex: Cl.uint(1),
      resourceName: Cl.stringUtf8(resourceName),
      createdAt: (getRecentPaymentDataByAddress as any).value.createdAt
    });
    
    expect(getRecentPaymentDataByAddress).toBeSome(expectedInvoiceData);
  });
});
