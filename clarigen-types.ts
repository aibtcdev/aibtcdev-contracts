
import type { TypedAbiArg, TypedAbiFunction, TypedAbiMap, TypedAbiVariable, Response } from '@clarigen/core';

export const contracts = {
  aibtcdevAibtc: {
  "functions": {
    burnFixedManyIter: {"name":"burn-fixed-many-iter","access":"private","args":[{"name":"item","type":{"tuple":[{"name":"amount","type":"uint128"},{"name":"sender","type":"principal"}]}}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[item: TypedAbiArg<{
  "amount": number | bigint;
  "sender": string;
}, "item">], Response<boolean, bigint>>,
    checkIsApproved: {"name":"check-is-approved","access":"private","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[], Response<boolean, bigint>>,
    checkIsOwner: {"name":"check-is-owner","access":"private","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[], Response<boolean, bigint>>,
    decimalsToFixed: {"name":"decimals-to-fixed","access":"private","args":[{"name":"amount","type":"uint128"}],"outputs":{"type":"uint128"}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">], bigint>,
    powDecimals: {"name":"pow-decimals","access":"private","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    addApprovedContract: {"name":"add-approved-contract","access":"public","args":[{"name":"new-approved-contract","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[newApprovedContract: TypedAbiArg<string, "newApprovedContract">], Response<boolean, bigint>>,
    burn: {"name":"burn","access":"public","args":[{"name":"amount","type":"uint128"},{"name":"sender","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">, sender: TypedAbiArg<string, "sender">], Response<boolean, bigint>>,
    burnFixed: {"name":"burn-fixed","access":"public","args":[{"name":"amount","type":"uint128"},{"name":"sender","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">, sender: TypedAbiArg<string, "sender">], Response<boolean, bigint>>,
    burnFixedMany: {"name":"burn-fixed-many","access":"public","args":[{"name":"senders","type":{"list":{"type":{"tuple":[{"name":"amount","type":"uint128"},{"name":"sender","type":"principal"}]},"length":200}}}],"outputs":{"type":{"response":{"ok":{"list":{"type":{"response":{"ok":"bool","error":"uint128"}},"length":200}},"error":"uint128"}}}} as TypedAbiFunction<[senders: TypedAbiArg<{
  "amount": number | bigint;
  "sender": string;
}[], "senders">], Response<Response<boolean, bigint>[], bigint>>,
    faucetDrip: {"name":"faucet-drip","access":"public","args":[{"name":"recipient","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[recipient: TypedAbiArg<string, "recipient">], Response<boolean, bigint>>,
    faucetDrop: {"name":"faucet-drop","access":"public","args":[{"name":"recipient","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[recipient: TypedAbiArg<string, "recipient">], Response<boolean, bigint>>,
    faucetFlood: {"name":"faucet-flood","access":"public","args":[{"name":"recipient","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[recipient: TypedAbiArg<string, "recipient">], Response<boolean, bigint>>,
    mint: {"name":"mint","access":"public","args":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">, recipient: TypedAbiArg<string, "recipient">], Response<boolean, bigint>>,
    mintFixed: {"name":"mint-fixed","access":"public","args":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">, recipient: TypedAbiArg<string, "recipient">], Response<boolean, bigint>>,
    setApprovedContract: {"name":"set-approved-contract","access":"public","args":[{"name":"owner","type":"principal"},{"name":"approved","type":"bool"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[owner: TypedAbiArg<string, "owner">, approved: TypedAbiArg<boolean, "approved">], Response<boolean, bigint>>,
    setContractOwner: {"name":"set-contract-owner","access":"public","args":[{"name":"owner","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[owner: TypedAbiArg<string, "owner">], Response<boolean, bigint>>,
    setDecimals: {"name":"set-decimals","access":"public","args":[{"name":"new-decimals","type":"uint128"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[newDecimals: TypedAbiArg<number | bigint, "newDecimals">], Response<boolean, bigint>>,
    setName: {"name":"set-name","access":"public","args":[{"name":"new-name","type":{"string-ascii":{"length":32}}}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[newName: TypedAbiArg<string, "newName">], Response<boolean, bigint>>,
    setSymbol: {"name":"set-symbol","access":"public","args":[{"name":"new-symbol","type":{"string-ascii":{"length":10}}}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[newSymbol: TypedAbiArg<string, "newSymbol">], Response<boolean, bigint>>,
    setTokenUri: {"name":"set-token-uri","access":"public","args":[{"name":"new-uri","type":{"optional":{"string-utf8":{"length":256}}}}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[newUri: TypedAbiArg<string | null, "newUri">], Response<boolean, bigint>>,
    transfer: {"name":"transfer","access":"public","args":[{"name":"amount","type":"uint128"},{"name":"sender","type":"principal"},{"name":"recipient","type":"principal"},{"name":"memo","type":{"optional":{"buffer":{"length":34}}}}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">, sender: TypedAbiArg<string, "sender">, recipient: TypedAbiArg<string, "recipient">, memo: TypedAbiArg<Uint8Array | null, "memo">], Response<boolean, bigint>>,
    transferFixed: {"name":"transfer-fixed","access":"public","args":[{"name":"amount","type":"uint128"},{"name":"sender","type":"principal"},{"name":"recipient","type":"principal"},{"name":"memo","type":{"optional":{"buffer":{"length":34}}}}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">, sender: TypedAbiArg<string, "sender">, recipient: TypedAbiArg<string, "recipient">, memo: TypedAbiArg<Uint8Array | null, "memo">], Response<boolean, bigint>>,
    fixedToDecimals: {"name":"fixed-to-decimals","access":"read_only","args":[{"name":"amount","type":"uint128"}],"outputs":{"type":"uint128"}} as TypedAbiFunction<[amount: TypedAbiArg<number | bigint, "amount">], bigint>,
    getBalance: {"name":"get-balance","access":"read_only","args":[{"name":"who","type":"principal"}],"outputs":{"type":{"response":{"ok":"uint128","error":"none"}}}} as TypedAbiFunction<[who: TypedAbiArg<string, "who">], Response<bigint, null>>,
    getBalanceFixed: {"name":"get-balance-fixed","access":"read_only","args":[{"name":"account","type":"principal"}],"outputs":{"type":{"response":{"ok":"uint128","error":"none"}}}} as TypedAbiFunction<[account: TypedAbiArg<string, "account">], Response<bigint, null>>,
    getContractOwner: {"name":"get-contract-owner","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":"principal","error":"none"}}}} as TypedAbiFunction<[], Response<string, null>>,
    getDecimals: {"name":"get-decimals","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":"uint128","error":"none"}}}} as TypedAbiFunction<[], Response<bigint, null>>,
    getName: {"name":"get-name","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":32}},"error":"none"}}}} as TypedAbiFunction<[], Response<string, null>>,
    getSymbol: {"name":"get-symbol","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":10}},"error":"none"}}}} as TypedAbiFunction<[], Response<string, null>>,
    getTokenUri: {"name":"get-token-uri","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":{"optional":{"string-utf8":{"length":256}}},"error":"none"}}}} as TypedAbiFunction<[], Response<string | null, null>>,
    getTotalSupply: {"name":"get-total-supply","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":"uint128","error":"none"}}}} as TypedAbiFunction<[], Response<bigint, null>>,
    getTotalSupplyFixed: {"name":"get-total-supply-fixed","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":"uint128","error":"none"}}}} as TypedAbiFunction<[], Response<bigint, null>>
  },
  "maps": {
    approvedContracts: {"name":"approved-contracts","key":"principal","value":"bool"} as TypedAbiMap<string, boolean>
  },
  "variables": {
    ERR_NOT_AUTHORIZED: {
  name: 'ERR-NOT-AUTHORIZED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    FAUCET_DRIP: {
  name: 'FAUCET-DRIP',
  type: 'uint128',
  access: 'constant'
} as TypedAbiVariable<bigint>,
    FAUCET_DROP: {
  name: 'FAUCET-DROP',
  type: 'uint128',
  access: 'constant'
} as TypedAbiVariable<bigint>,
    FAUCET_FLOOD: {
  name: 'FAUCET-FLOOD',
  type: 'uint128',
  access: 'constant'
} as TypedAbiVariable<bigint>,
    oNE_8: {
  name: 'ONE_8',
  type: 'uint128',
  access: 'constant'
} as TypedAbiVariable<bigint>,
    contractOwner: {
  name: 'contract-owner',
  type: 'principal',
  access: 'variable'
} as TypedAbiVariable<string>,
    tokenDecimals: {
  name: 'token-decimals',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>,
    tokenName: {
  name: 'token-name',
  type: {
    'string-ascii': {
      length: 32
    }
  },
  access: 'variable'
} as TypedAbiVariable<string>,
    tokenSymbol: {
  name: 'token-symbol',
  type: {
    'string-ascii': {
      length: 10
    }
  },
  access: 'variable'
} as TypedAbiVariable<string>,
    tokenUri: {
  name: 'token-uri',
  type: {
    optional: {
      'string-utf8': {
        length: 256
      }
    }
  },
  access: 'variable'
} as TypedAbiVariable<string | null>
  },
  constants: {
  eRRNOTAUTHORIZED: {
    isOk: false,
    value: 1_000n
  },
  fAUCETDRIP: 10_000n,
  fAUCETDROP: 1_000_000n,
  fAUCETFLOOD: 100_000_000n,
  oNE_8: 100_000_000n,
  contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  tokenDecimals: 8n,
  tokenName: 'aiBTC',
  tokenSymbol: 'aiBTC',
  tokenUri: 'https://cdn.alexlab.co/metadata/token-abtc.json'
},
  "non_fungible_tokens": [
    
  ],
  "fungible_tokens":[{"name":"bridged-btc"}],"epoch":"Epoch24","clarity_version":"Clarity2",
  contractName: 'aibtcdev-aibtc',
  },
aibtcdevResourcesV1: {
  "functions": {
    getOrCreateUser: {"name":"get-or-create-user","access":"private","args":[{"name":"address","type":"principal"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[address: TypedAbiArg<string, "address">], Response<bigint, bigint>>,
    isDeployer: {"name":"is-deployer","access":"private","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[], Response<boolean, bigint>>,
    addResource: {"name":"add-resource","access":"public","args":[{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"description","type":{"string-utf8":{"length":255}}},{"name":"price","type":"uint128"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">, description: TypedAbiArg<string, "description">, price: TypedAbiArg<number | bigint, "price">], Response<bigint, bigint>>,
    payInvoice: {"name":"pay-invoice","access":"public","args":[{"name":"resourceIndex","type":"uint128"},{"name":"memo","type":{"optional":{"buffer":{"length":34}}}}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[resourceIndex: TypedAbiArg<number | bigint, "resourceIndex">, memo: TypedAbiArg<Uint8Array | null, "memo">], Response<bigint, bigint>>,
    payInvoiceByResourceName: {"name":"pay-invoice-by-resource-name","access":"public","args":[{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"memo","type":{"optional":{"buffer":{"length":34}}}}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">, memo: TypedAbiArg<Uint8Array | null, "memo">], Response<bigint, bigint>>,
    setPaymentAddress: {"name":"set-payment-address","access":"public","args":[{"name":"oldAddress","type":"principal"},{"name":"newAddress","type":"principal"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[oldAddress: TypedAbiArg<string, "oldAddress">, newAddress: TypedAbiArg<string, "newAddress">], Response<boolean, bigint>>,
    toggleResource: {"name":"toggle-resource","access":"public","args":[{"name":"index","type":"uint128"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[index: TypedAbiArg<number | bigint, "index">], Response<boolean, bigint>>,
    toggleResourceByName: {"name":"toggle-resource-by-name","access":"public","args":[{"name":"name","type":{"string-utf8":{"length":50}}}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">], Response<boolean, bigint>>,
    getInvoice: {"name":"get-invoice","access":"read_only","args":[{"name":"index","type":"uint128"}],"outputs":{"type":{"optional":{"tuple":[{"name":"amount","type":"uint128"},{"name":"createdAt","type":"uint128"},{"name":"resourceIndex","type":"uint128"},{"name":"resourceName","type":{"string-utf8":{"length":50}}},{"name":"userIndex","type":"uint128"}]}}}} as TypedAbiFunction<[index: TypedAbiArg<number | bigint, "index">], {
  "amount": bigint;
  "createdAt": bigint;
  "resourceIndex": bigint;
  "resourceName": string;
  "userIndex": bigint;
} | null>,
    getPaymentAddress: {"name":"get-payment-address","access":"read_only","args":[],"outputs":{"type":{"optional":"principal"}}} as TypedAbiFunction<[], string | null>,
    getRecentPayment: {"name":"get-recent-payment","access":"read_only","args":[{"name":"resourceIndex","type":"uint128"},{"name":"userIndex","type":"uint128"}],"outputs":{"type":{"optional":"uint128"}}} as TypedAbiFunction<[resourceIndex: TypedAbiArg<number | bigint, "resourceIndex">, userIndex: TypedAbiArg<number | bigint, "userIndex">], bigint | null>,
    getRecentPaymentData: {"name":"get-recent-payment-data","access":"read_only","args":[{"name":"resourceIndex","type":"uint128"},{"name":"userIndex","type":"uint128"}],"outputs":{"type":{"optional":{"tuple":[{"name":"amount","type":"uint128"},{"name":"createdAt","type":"uint128"},{"name":"resourceIndex","type":"uint128"},{"name":"resourceName","type":{"string-utf8":{"length":50}}},{"name":"userIndex","type":"uint128"}]}}}} as TypedAbiFunction<[resourceIndex: TypedAbiArg<number | bigint, "resourceIndex">, userIndex: TypedAbiArg<number | bigint, "userIndex">], {
  "amount": bigint;
  "createdAt": bigint;
  "resourceIndex": bigint;
  "resourceName": string;
  "userIndex": bigint;
} | null>,
    getRecentPaymentDataByAddress: {"name":"get-recent-payment-data-by-address","access":"read_only","args":[{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"user","type":"principal"}],"outputs":{"type":{"optional":{"tuple":[{"name":"amount","type":"uint128"},{"name":"createdAt","type":"uint128"},{"name":"resourceIndex","type":"uint128"},{"name":"resourceName","type":{"string-utf8":{"length":50}}},{"name":"userIndex","type":"uint128"}]}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">, user: TypedAbiArg<string, "user">], {
  "amount": bigint;
  "createdAt": bigint;
  "resourceIndex": bigint;
  "resourceName": string;
  "userIndex": bigint;
} | null>,
    getResource: {"name":"get-resource","access":"read_only","args":[{"name":"index","type":"uint128"}],"outputs":{"type":{"optional":{"tuple":[{"name":"createdAt","type":"uint128"},{"name":"description","type":{"string-utf8":{"length":255}}},{"name":"enabled","type":"bool"},{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"price","type":"uint128"},{"name":"totalSpent","type":"uint128"},{"name":"totalUsed","type":"uint128"}]}}}} as TypedAbiFunction<[index: TypedAbiArg<number | bigint, "index">], {
  "createdAt": bigint;
  "description": string;
  "enabled": boolean;
  "name": string;
  "price": bigint;
  "totalSpent": bigint;
  "totalUsed": bigint;
} | null>,
    getResourceByName: {"name":"get-resource-by-name","access":"read_only","args":[{"name":"name","type":{"string-utf8":{"length":50}}}],"outputs":{"type":{"optional":{"tuple":[{"name":"createdAt","type":"uint128"},{"name":"description","type":{"string-utf8":{"length":255}}},{"name":"enabled","type":"bool"},{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"price","type":"uint128"},{"name":"totalSpent","type":"uint128"},{"name":"totalUsed","type":"uint128"}]}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">], {
  "createdAt": bigint;
  "description": string;
  "enabled": boolean;
  "name": string;
  "price": bigint;
  "totalSpent": bigint;
  "totalUsed": bigint;
} | null>,
    getResourceIndex: {"name":"get-resource-index","access":"read_only","args":[{"name":"name","type":{"string-utf8":{"length":50}}}],"outputs":{"type":{"optional":"uint128"}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">], bigint | null>,
    getTotalInvoices: {"name":"get-total-invoices","access":"read_only","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    getTotalResources: {"name":"get-total-resources","access":"read_only","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    getTotalRevenue: {"name":"get-total-revenue","access":"read_only","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    getTotalUsers: {"name":"get-total-users","access":"read_only","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    getUserData: {"name":"get-user-data","access":"read_only","args":[{"name":"index","type":"uint128"}],"outputs":{"type":{"optional":{"tuple":[{"name":"address","type":"principal"},{"name":"totalSpent","type":"uint128"},{"name":"totalUsed","type":"uint128"}]}}}} as TypedAbiFunction<[index: TypedAbiArg<number | bigint, "index">], {
  "address": string;
  "totalSpent": bigint;
  "totalUsed": bigint;
} | null>,
    getUserDataByAddress: {"name":"get-user-data-by-address","access":"read_only","args":[{"name":"user","type":"principal"}],"outputs":{"type":{"optional":{"tuple":[{"name":"address","type":"principal"},{"name":"totalSpent","type":"uint128"},{"name":"totalUsed","type":"uint128"}]}}}} as TypedAbiFunction<[user: TypedAbiArg<string, "user">], {
  "address": string;
  "totalSpent": bigint;
  "totalUsed": bigint;
} | null>,
    getUserIndex: {"name":"get-user-index","access":"read_only","args":[{"name":"user","type":"principal"}],"outputs":{"type":{"optional":"uint128"}}} as TypedAbiFunction<[user: TypedAbiArg<string, "user">], bigint | null>
  },
  "maps": {
    invoiceData: {"name":"InvoiceData","key":"uint128","value":{"tuple":[{"name":"amount","type":"uint128"},{"name":"createdAt","type":"uint128"},{"name":"resourceIndex","type":"uint128"},{"name":"resourceName","type":{"string-utf8":{"length":50}}},{"name":"userIndex","type":"uint128"}]}} as TypedAbiMap<number | bigint, {
  "amount": bigint;
  "createdAt": bigint;
  "resourceIndex": bigint;
  "resourceName": string;
  "userIndex": bigint;
}>,
    recentPayments: {"name":"RecentPayments","key":{"tuple":[{"name":"resourceIndex","type":"uint128"},{"name":"userIndex","type":"uint128"}]},"value":"uint128"} as TypedAbiMap<{
  "resourceIndex": number | bigint;
  "userIndex": number | bigint;
}, bigint>,
    resourceData: {"name":"ResourceData","key":"uint128","value":{"tuple":[{"name":"createdAt","type":"uint128"},{"name":"description","type":{"string-utf8":{"length":255}}},{"name":"enabled","type":"bool"},{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"price","type":"uint128"},{"name":"totalSpent","type":"uint128"},{"name":"totalUsed","type":"uint128"}]}} as TypedAbiMap<number | bigint, {
  "createdAt": bigint;
  "description": string;
  "enabled": boolean;
  "name": string;
  "price": bigint;
  "totalSpent": bigint;
  "totalUsed": bigint;
}>,
    resourceIndexes: {"name":"ResourceIndexes","key":{"string-utf8":{"length":50}},"value":"uint128"} as TypedAbiMap<string, bigint>,
    userData: {"name":"UserData","key":"uint128","value":{"tuple":[{"name":"address","type":"principal"},{"name":"totalSpent","type":"uint128"},{"name":"totalUsed","type":"uint128"}]}} as TypedAbiMap<number | bigint, {
  "address": string;
  "totalSpent": bigint;
  "totalUsed": bigint;
}>,
    userIndexes: {"name":"UserIndexes","key":"principal","value":"uint128"} as TypedAbiMap<string, bigint>
  },
  "variables": {
    DEPLOYER: {
  name: 'DEPLOYER',
  type: 'principal',
  access: 'constant'
} as TypedAbiVariable<string>,
    ERR_DELETING_RESOURCE_DATA: {
  name: 'ERR_DELETING_RESOURCE_DATA',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVALID_PARAMS: {
  name: 'ERR_INVALID_PARAMS',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVOICE_ALREADY_PAID: {
  name: 'ERR_INVOICE_ALREADY_PAID',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVOICE_NOT_FOUND: {
  name: 'ERR_INVOICE_NOT_FOUND',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_NAME_ALREADY_USED: {
  name: 'ERR_NAME_ALREADY_USED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_RECENT_PAYMENT_NOT_FOUND: {
  name: 'ERR_RECENT_PAYMENT_NOT_FOUND',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_RESOURCE_NOT_ENABLED: {
  name: 'ERR_RESOURCE_NOT_ENABLED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_RESOURCE_NOT_FOUND: {
  name: 'ERR_RESOURCE_NOT_FOUND',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_SAVING_INVOICE_DATA: {
  name: 'ERR_SAVING_INVOICE_DATA',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_SAVING_RESOURCE_DATA: {
  name: 'ERR_SAVING_RESOURCE_DATA',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_SAVING_USER_DATA: {
  name: 'ERR_SAVING_USER_DATA',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_UNAUTHORIZED: {
  name: 'ERR_UNAUTHORIZED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_USER_ALREADY_EXISTS: {
  name: 'ERR_USER_ALREADY_EXISTS',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_USER_NOT_FOUND: {
  name: 'ERR_USER_NOT_FOUND',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    oNE_8: {
  name: 'ONE_8',
  type: 'uint128',
  access: 'constant'
} as TypedAbiVariable<bigint>,
    SELF: {
  name: 'SELF',
  type: 'principal',
  access: 'constant'
} as TypedAbiVariable<string>,
    invoiceCount: {
  name: 'invoiceCount',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>,
    paymentAddress: {
  name: 'paymentAddress',
  type: 'principal',
  access: 'variable'
} as TypedAbiVariable<string>,
    resourceCount: {
  name: 'resourceCount',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>,
    totalRevenue: {
  name: 'totalRevenue',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>,
    userCount: {
  name: 'userCount',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>
  },
  constants: {
  DEPLOYER: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  ERR_DELETING_RESOURCE_DATA: {
    isOk: false,
    value: 1_004n
  },
  ERR_INVALID_PARAMS: {
    isOk: false,
    value: 1_001n
  },
  ERR_INVOICE_ALREADY_PAID: {
    isOk: false,
    value: 1_010n
  },
  ERR_INVOICE_NOT_FOUND: {
    isOk: false,
    value: 1_012n
  },
  ERR_NAME_ALREADY_USED: {
    isOk: false,
    value: 1_002n
  },
  ERR_RECENT_PAYMENT_NOT_FOUND: {
    isOk: false,
    value: 1_013n
  },
  ERR_RESOURCE_NOT_ENABLED: {
    isOk: false,
    value: 1_006n
  },
  ERR_RESOURCE_NOT_FOUND: {
    isOk: false,
    value: 1_005n
  },
  ERR_SAVING_INVOICE_DATA: {
    isOk: false,
    value: 1_011n
  },
  ERR_SAVING_RESOURCE_DATA: {
    isOk: false,
    value: 1_003n
  },
  ERR_SAVING_USER_DATA: {
    isOk: false,
    value: 1_008n
  },
  ERR_UNAUTHORIZED: {
    isOk: false,
    value: 1_000n
  },
  ERR_USER_ALREADY_EXISTS: {
    isOk: false,
    value: 1_007n
  },
  ERR_USER_NOT_FOUND: {
    isOk: false,
    value: 1_009n
  },
  oNE_8: 100_000_000n,
  SELF: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdevResourcesV1-vars',
  invoiceCount: 0n,
  paymentAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  resourceCount: 0n,
  totalRevenue: 0n,
  userCount: 0n
},
  "non_fungible_tokens": [
    
  ],
  "fungible_tokens":[],"epoch":"Epoch24","clarity_version":"Clarity2",
  contractName: 'aibtcdev-resources-v1',
  },
aibtcdevTraitsV1: {
  "functions": {
    
  },
  "maps": {
    
  },
  "variables": {
    
  },
  constants: {},
  "non_fungible_tokens": [
    
  ],
  "fungible_tokens":[],"epoch":"Epoch24","clarity_version":"Clarity2",
  contractName: 'aibtcdev-traits-v1',
  }
} as const;

export const accounts = {"deployer":{"address":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","balance":"100000000000000"},"faucet":{"address":"STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6","balance":"100000000000000"},"wallet_1":{"address":"ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5","balance":"100000000000000"},"wallet_2":{"address":"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG","balance":"100000000000000"},"wallet_3":{"address":"ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC","balance":"100000000000000"},"wallet_4":{"address":"ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND","balance":"100000000000000"},"wallet_5":{"address":"ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB","balance":"100000000000000"},"wallet_6":{"address":"ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0","balance":"100000000000000"},"wallet_7":{"address":"ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ","balance":"100000000000000"},"wallet_8":{"address":"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP","balance":"100000000000000"}} as const;

export const identifiers = {"aibtcdevAibtc":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-aibtc","aibtcdevResourcesV1":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-resources-v1","aibtcdevTraitsV1":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-traits-v1"} as const

export const simnet = {
  accounts,
  contracts,
  identifiers,
} as const;


export const deployments = {"aibtcdevAibtc":{"devnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-aibtc","simnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-aibtc","testnet":null,"mainnet":null},"aibtcdevResourcesV1":{"devnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-resources-v1","simnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-resources-v1","testnet":null,"mainnet":null},"aibtcdevTraitsV1":{"devnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-traits-v1","simnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-traits-v1","testnet":null,"mainnet":null}} as const;

export const project = {
  contracts,
  deployments,
} as const;
  