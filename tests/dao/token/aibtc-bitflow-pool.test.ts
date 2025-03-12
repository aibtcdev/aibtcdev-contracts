import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-pre-dex";
const contractAddress = `${deployer}.${contractName}`;

describe(`token: ${contractName}`, () => {
  it("get-pool() should return the pool information", () => {
    // arrange
    const expectedObject = Cl.tuple({
      "pool-id": Cl.uint(0),
      "pool-name": Cl.stringAscii(""),
      "pool-symbol": Cl.stringAscii(""),
      "pool-uri": Cl.stringUtf8(""),
      "pool-created": Cl.bool(false),
      "creation-height": Cl.uint(0),
      "pool-status": Cl.bool(false),
      "core-address": Cl.principal(
        "ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1.xyk-core-v-1-2"
      ),
      "fee-address": Cl.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
      "x-token": Cl.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
      "y-token": Cl.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
      "pool-token": Cl.principal(
        "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-bitflow-pool"
      ),
      "x-balance": Cl.uint(0),
      "y-balance": Cl.uint(0),
      "total-shares": Cl.uint(0),
      "x-protocol-fee": Cl.uint(0),
      "x-provider-fee": Cl.uint(0),
      "y-protocol-fee": Cl.uint(0),
      "y-provider-fee": Cl.uint(0),
    });
    // act
    const result = simnet.callReadOnlyFn(
      "aibtc-bitflow-pool",
      "get-pool",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeOk(expectedObject);
  });
});
