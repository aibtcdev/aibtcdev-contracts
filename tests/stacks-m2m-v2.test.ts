import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

enum ErrCode {
  ERR_UNAUTHORIZED = 1000,
  ERR_INVALID_PARAMS,
  ERR_NAME_ALREADY_USED,
  ERR_SAVING_RESOURCE_DATA,
  ERR_DELETING_RESOURCE_DATA,
  ERR_RESOURCE_NOT_FOUND,
  ERR_USER_ALREADY_EXISTS,
  ERR_SAVING_USER_DATA,
  ERR_USER_NOT_FOUND,
  ERR_INVOICE_ALREADY_PAID,
  ERR_SAVING_INVOICE_DATA,
}

const createResource = (name: string, desc: string, price: number) => {
  return [Cl.stringUtf8(name), Cl.stringUtf8(desc), Cl.uint(price)];
};

const defaultPrice = 10_000; // 0.0001 aBTC

const testResource = [
  Cl.stringUtf8("Bitcoin Face"),
  Cl.stringUtf8("Generate a unique Bitcoin face."),
  Cl.uint(defaultPrice),
];

describe("Adding a resource", () => {
  it("add-resource() fails if not called by deployer", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("add-resource() fails if name is blank", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      createResource("", "description", defaultPrice),
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("add-resource() fails if description is blank", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      createResource("name", "", defaultPrice),
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("add-resource() fails if price is 0", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      createResource("name", "description", 0),
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });
  it("add-resource() fails if name already used", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const expectedCount = 1;
    // ACT
    const firstResponse = simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    const secondResponse = simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // ASSERT
    expect(firstResponse.result).toBeOk(Cl.uint(expectedCount));
    expect(secondResponse.result).toBeErr(
      Cl.uint(ErrCode.ERR_NAME_ALREADY_USED)
    );
  });

  it("add-resource() succeeds and increments resource count", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const expectedCount = 1;
    // ACT
    const oldCount = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-total-resources",
      [],
      deployer
    );
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    const newCount = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-total-resources",
      [],
      deployer
    );
    // ASSERT
    expect(oldCount.result).toBeUint(expectedCount - 1);
    expect(response.result).toBeOk(Cl.uint(expectedCount));
    expect(newCount.result).toBeUint(expectedCount);
  });
});

describe("Deleting a Resource", () => {
  it("delete-resource() fails if not called by deployer", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "delete-resource",
      [Cl.uint(1)],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("delete-resource() fails if provided index is greater than current resource count", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("delete-resource() fails if executed twice on the same resource", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource again
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(
      Cl.uint(ErrCode.ERR_DELETING_RESOURCE_DATA)
    );
  });

  it("delete-resource-by-name() fails if not called by deployer", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "delete-resource-by-name",
      [Cl.stringUtf8("Bitcoin Face")],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("delete-resource-by-name() fails if provided name is not found", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "delete-resource-by-name",
      [Cl.stringUtf8("Nothingburger")],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("pay-invoice() fails for a deleted resource", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    const deployer = accounts.get("deployer")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // pay invoice
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        Cl.none(), // memo
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND));
  });
});

describe("Setting a Payment Address", () => {
  it("set-payment-address() fails if not called by deployer", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    // get current payment address
    const currentPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const currentPaymentAddress = cvToValue(
      currentPaymentAddressResponse.result
    );
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "set-payment-address",
      [
        Cl.standardPrincipal(currentPaymentAddress.value),
        Cl.standardPrincipal(address1),
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("set-payment-address() fails if old address param is incorrect", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    const deployer = accounts.get("deployer")!;
    // ACT
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "set-payment-address",
      [Cl.standardPrincipal(address1), Cl.standardPrincipal(address1)],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("set-payment-address() succeeds if called by the deployer", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;

    // ACT
    // get current payment address
    const currentPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const currentPaymentAddress = cvToValue(
      currentPaymentAddressResponse.result
    );
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "set-payment-address",
      [
        Cl.standardPrincipal(currentPaymentAddress.value),
        Cl.standardPrincipal(address1),
      ],
      deployer
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.bool(true));
  });

  it("set-payment-address() succeeds if called by current payment address", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;

    // ACT
    // get current payment address
    const currentPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const currentPaymentAddress = cvToValue(
      currentPaymentAddressResponse.result
    );
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "set-payment-address",
      [
        Cl.standardPrincipal(currentPaymentAddress.value),
        Cl.standardPrincipal(address1),
      ],
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // get current payment address again
    const updatedPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const updatedPaymentAddress = cvToValue(
      updatedPaymentAddressResponse.result
    );
    // set payment address again
    const secondResponse = simnet.callPublicFn(
      "stacks-m2m-v2",
      "set-payment-address",
      [Cl.standardPrincipal(address1), Cl.standardPrincipal(address2)],
      address1
    );
    // ASSERT
    expect(updatedPaymentAddress.value).toEqual(address1);
    expect(response.result).toBeOk(Cl.bool(true));
    expect(secondResponse.result).toBeOk(Cl.bool(true));
  });
});

describe("Paying an invoice", () => {
  it("pay-invoice() fails if resource is not found", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "pay-invoice",
      [
        Cl.uint(0), // resource index
        Cl.none(), // memo
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND));
  });
  // not expecting ERR_USER_NOT_FOUND, not sure if we can force?
  // it("pay-invoice() fails if user cannot be created or found", () => {})
  // not expecting ERR_INVOICE_HASH_NOT_FOUND, same as above
  // it("pay-invoice() fails if invoice hash cannot be found", () => {})
  // not expecting ERR_SAVING_INVOICE in two spots, same as above
  // it("pay-invoice() fails if invoice cannot be saved", () => {})
  it("pay-invoice() succeeds and returns invoice count without memo", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const expectedCount = 1;
    // ACT
    // mint aBTC to pay for resources
    simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address1)],
      address1
    );
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice for resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        Cl.none(), // memo
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.uint(expectedCount));
  });

  it("pay-invoice() succeeds and returns invoice count with memo", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const expectedCount = 1;
    const memo = Buffer.from("This is a memo test!");
    // ACT
    // mint aBTC to pay for resources
    simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address1)],
      address1
    );
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice for resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v2",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        Cl.some(Cl.buffer(memo)), // memo
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.uint(expectedCount));
  });

  it("pay-invoice() succeeds and returns invoice count with memo over several blocks", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;
    const address3 = accounts.get("wallet_3")!;
    const expectedCount = 1;
    const memo = Cl.none();
    // ACT
    // mint aBTC to pay for resources
    simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address1)],
      address1
    );
    // mint aBTC to pay for resources
    simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address2)],
      address2
    );
    // mint aBTC to pay for resources
    simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address3)],
      address3
    );
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice once for 3 users
    const blockResponses = [
      simnet.callPublicFn(
        "stacks-m2m-v2",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address1
      ),
      simnet.callPublicFn(
        "stacks-m2m-v2",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address2
      ),
      simnet.callPublicFn(
        "stacks-m2m-v2",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address3
      ),
    ];
    // progress by 5000 blocks
    simnet.mineEmptyBlocks(5000);
    // pay invoice again for 3 users
    blockResponses.push(
      simnet.callPublicFn(
        "stacks-m2m-v2",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address1
      ),
      simnet.callPublicFn(
        "stacks-m2m-v2",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address2
      ),
      simnet.callPublicFn(
        "stacks-m2m-v2",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address3
      )
    );
    // ASSERT
    for (let i = 0; i < blockResponses.length; i++) {
      expect(blockResponses[i].result).toBeOk(Cl.uint(expectedCount + i));
    }
  });

  it("pay-invoice() succeeds and updates resource and user data", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;
    const deployer = accounts.get("deployer")!;
    const memo = Cl.none();
    // ACT
    // mint aBTC to pay for resources
    simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address1)],
      address1
    );
    simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address2)],
      address2
    );
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice for resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        memo, // memo
      ],
      address1
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // pay invoice again for resource
    simnet.callPublicFn(
      "stacks-m2m-v2",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        memo, // memo
      ],
      address2
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // get resource
    const resourceResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-resource",
      [Cl.uint(1)],
      deployer
    );
    // get user
    const userResponseOne = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-user-data-by-address",
      [Cl.standardPrincipal(address1)],
      deployer
    );
    const userResponseTwo = simnet.callReadOnlyFn(
      "stacks-m2m-v2",
      "get-user-data-by-address",
      [Cl.standardPrincipal(address2)],
      deployer
    );
    // ASSERT
    expect(resourceResponse.result).toBeSome(
      Cl.tuple({
        createdAt: Cl.uint(4),
        description: Cl.stringUtf8("Generate a unique Bitcoin face."),
        name: Cl.stringUtf8("Bitcoin Face"),
        price: Cl.uint(defaultPrice),
        totalSpent: Cl.uint(defaultPrice * 2),
        totalUsed: Cl.uint(2),
      })
    );
    expect(userResponseOne.result).toBeSome(
      Cl.tuple({
        address: Cl.standardPrincipal(address1),
        totalSpent: Cl.uint(defaultPrice),
        totalUsed: Cl.uint(1),
      })
    );
    expect(userResponseTwo.result).toBeSome(
      Cl.tuple({
        address: Cl.standardPrincipal(address2),
        totalSpent: Cl.uint(defaultPrice),
        totalUsed: Cl.uint(1),
      })
    );
  });
});
