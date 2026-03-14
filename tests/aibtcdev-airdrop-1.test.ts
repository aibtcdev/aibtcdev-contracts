import { Tx, tx } from "@hirosystems/clarinet-sdk";
import {
  boolCV,
  Cl,
  noneCV,
  principalCV,
  someCV,
  stringAsciiCV,
  uintCV,
} from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

const CONTRACT = "aibtcdev-airdrop-1";

const getLastTokenId = () => {
  return simnet.callReadOnlyFn(
    CONTRACT,
    "get-last-token-id",
    [],
    simnet.deployer
  ).result;
};

const getOwner = (id: number) => {
  return simnet.callReadOnlyFn(
    CONTRACT,
    "get-owner",
    [uintCV(id)],
    simnet.deployer
  ).result;
};

const transfer = (id: number, from: string, to: string, sender: string) => {
  return tx.callPublicFn(
    CONTRACT,
    "transfer",
    [uintCV(id), principalCV(from), principalCV(to)],
    sender
  );
};

const mint = (to: string, sender: string | string = simnet.deployer) => {
  return tx.callPublicFn(CONTRACT, "mint", [principalCV(to)], sender);
};

const burn = (id: number, from: string, sender: string) => {
  return tx.callPublicFn(
    CONTRACT,
    "burn",
    [uintCV(id), principalCV(from)],
    sender
  );
};

const setUrl = (newUrl: string, sender: string) => {
  return tx.callPublicFn(
    CONTRACT,
    "set-url",
    [stringAsciiCV(newUrl)],
    sender
  );
};

const getTokenUri = (id: number) => {
  return simnet.callReadOnlyFn(
    CONTRACT,
    "get-token-uri",
    [uintCV(id)],
    simnet.deployer
  ).result;
};

const airdrop = (
  l1: string[],
  l2: string[],
  l3: string[],
  sender: string
) => {
  return tx.callPublicFn(
    CONTRACT,
    "airdrop",
    [
      Cl.list(l1.map((addr) => principalCV(addr))),
      Cl.list(l2.map((addr) => principalCV(addr))),
      Cl.list(l3.map((addr) => principalCV(addr))),
    ],
    sender
  );
};

describe("get-last-token-id", () => {
  it("returns 0 after deployment", () => {
    expect(getLastTokenId()).toBeOk(uintCV(0));
  });

  it("returns correct value after minting few NFT's", () => {
    const MIN = 0;
    const MAX = 200;
    const MINTS = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;

    const TXS = new Array(MINTS).fill(null).map(() => mint(simnet.deployer));

    simnet.mineBlock(TXS);

    expect(getLastTokenId()).toBeOk(uintCV(MINTS));
  });
});

describe("mint", () => {
  it("fails when called by someone who is not contract deployer", () => {
    const tx = mint(address1, address1);
    const result = simnet.mineBlock([tx])[0].result;

    expect(result).toBeErr(uintCV(401));
  });

  it("succeeds when called by anyone via proxy contract deployed by same address as NFT contract deployer", () => {
    const t1 = tx.callPublicFn(
      "proxy",
      "mint-aibtcdev-1",
      [principalCV(address1)],
      address1
    );
    const t2 = tx.callPublicFn(
      "proxy",
      "mint-aibtcdev-1",
      [principalCV(address1)],
      simnet.deployer
    );

    const block = simnet.mineBlock([t1, t2]);

    expect(block[0].result).toBeOk(boolCV(true));
    expect(block[1].result).toBeOk(boolCV(true));

    expect(getOwner(1)).toBeOk(someCV(principalCV(address1)));
    expect(getOwner(2)).toBeOk(someCV(principalCV(address1)));
  });

  it("fails when called by anyone via proxy contract deployed by different address than NFT contract deployer", () => {
    const t1 = tx.callPublicFn(
      `${address1}.external-proxy`,
      "mint-aibtcdev-1",
      [principalCV(address1)],
      address1
    );
    const t2 = tx.callPublicFn(
      `${address1}.external-proxy`,
      "mint-aibtcdev-1",
      [principalCV(address1)],
      simnet.deployer
    );

    const block = simnet.mineBlock([t1, t2]);

    expect(block[0].result).toBeErr(uintCV(401));
    expect(block[1].result).toBeErr(uintCV(401));
  });

  it("mints new NFT to transaction sender", () => {
    const t1 = mint(simnet.deployer);
    const t2 = mint(address1);

    expect(getOwner(1)).toBeOk(noneCV());
    expect(getOwner(2)).toBeOk(noneCV());

    simnet.mineBlock([t1, t2]);

    expect(getOwner(1)).toBeOk(someCV(principalCV(simnet.deployer)));
    expect(getOwner(2)).toBeOk(someCV(principalCV(address1)));
  });
});

describe("transfer", () => {
  it("fails when called by someone who is not NFT owner", () => {
    const owner = address1;
    const not_owner = simnet.deployer;

    simnet.mineBlock([mint(owner)]);
    expect(getOwner(1)).toBeOk(someCV(principalCV(owner)));

    const result = simnet.mineBlock([
      transfer(1, owner, not_owner, not_owner),
    ])[0].result;
    expect(result).toBeErr(uintCV(4));
  });

  it("transfers NFT from one account to another", () => {
    const from = address1;
    const to = simnet.deployer;

    simnet.mineBlock([mint(from), mint(from)]);
    expect(getOwner(1)).toBeOk(someCV(principalCV(from)));
    expect(getOwner(2)).toBeOk(someCV(principalCV(from)));

    const result = simnet.mineBlock([transfer(1, from, to, from)])[0].result;
    expect(result).toBeOk(boolCV(true));

    expect(getOwner(1)).toBeOk(someCV(principalCV(to)));
    expect(getOwner(2)).toBeOk(someCV(principalCV(from)));
  });
});

describe("burn", () => {
  it("fails when called by someone who is not NFT owner", () => {
    const owner = address1;
    const notOwner = simnet.deployer;

    simnet.mineBlock([mint(owner)]);
    expect(getOwner(1)).toBeOk(someCV(principalCV(owner)));

    const result = simnet.mineBlock([burn(1, owner, notOwner)])[0].result;
    expect(result).toBeErr(uintCV(4));
  });

  it("succeeds when called by NFT owner", () => {
    simnet.mineBlock([mint(address1)]);
    expect(getOwner(1)).toBeOk(someCV(principalCV(address1)));

    const result = simnet.mineBlock([burn(1, address1, address1)])[0].result;
    expect(result).toBeOk(boolCV(true));

    expect(getOwner(1)).toBeOk(noneCV());
  });

  it("succeeds when called via proxy contract by NFT owner", () => {
    simnet.mineBlock([mint(address1)]);
    expect(getOwner(1)).toBeOk(someCV(principalCV(address1)));

    const t = tx.callPublicFn(
      "proxy",
      "burn-aibtcdev-1",
      [uintCV(1), principalCV(address1)],
      address1
    );
    const result = simnet.mineBlock([t])[0].result;
    expect(result).toBeOk(boolCV(true));

    expect(getOwner(1)).toBeOk(noneCV());
  });
});

describe("get-token-uri", () => {
  it("returns the default URI after deployment", () => {
    simnet.mineBlock([mint(simnet.deployer)]);
    const result = getTokenUri(1);
    expect(result).toBeOk(someCV(stringAsciiCV("https://nft-ad-1.aibtc.dev/aibtcdev-1.json")));
  });

  it("returns updated URI after set-url is called", () => {
    simnet.mineBlock([mint(simnet.deployer)]);

    const newUrl = "https://example.com/new-metadata.json";
    simnet.mineBlock([setUrl(newUrl, simnet.deployer)]);

    const result = getTokenUri(1);
    expect(result).toBeOk(someCV(stringAsciiCV(newUrl)));
  });
});

describe("set-url", () => {
  it("fails when called by non-deployer", () => {
    const newUrl = "https://malicious.com/metadata.json";
    const result = simnet.mineBlock([setUrl(newUrl, address1)])[0].result;
    expect(result).toBeErr(uintCV(401));
  });

  it("succeeds when called by deployer", () => {
    const newUrl = "https://new.aibtc.dev/updated.json";
    const result = simnet.mineBlock([setUrl(newUrl, simnet.deployer)])[0].result;
    expect(result).toBeOk(boolCV(true));
  });

  it("succeeds when called via proxy contract by deployer", () => {
    const newUrl = "https://proxy.aibtc.dev/metadata.json";
    const t = tx.callPublicFn(
      "proxy",
      "set-url-aibtcdev-1",
      [stringAsciiCV(newUrl)],
      simnet.deployer
    );
    const result = simnet.mineBlock([t])[0].result;
    expect(result).toBeOk(boolCV(true));
  });

  it("fails when called via proxy contract by non-deployer", () => {
    const newUrl = "https://malicious.com/metadata.json";
    const t = tx.callPublicFn(
      `${address1}.external-proxy`,
      "set-url-aibtcdev-1",
      [stringAsciiCV(newUrl)],
      address1
    );
    const result = simnet.mineBlock([t])[0].result;
    expect(result).toBeErr(uintCV(401));
  });
});

describe("airdrop", () => {
  it("fails when called by non-deployer", () => {
    const recipients = [address1, address2];
    const result = simnet.mineBlock([airdrop(recipients, [], [], address1)])[0].result;
    expect(result).toBeErr(uintCV(401));
  });

  it("succeeds when called by deployer and mints to all recipients", () => {
    const recipients1 = [address1, address2];
    const result = simnet.mineBlock([airdrop(recipients1, [], [], simnet.deployer)])[0].result;
    expect(result).toBeOk(boolCV(true));

    expect(getOwner(1)).toBeOk(someCV(principalCV(address1)));
    expect(getOwner(2)).toBeOk(someCV(principalCV(address2)));
  });

  it("handles multiple lists correctly", () => {
    const recipients1 = [address1];
    const recipients2 = [address2];
    const recipients3: string[] = [];

    const result = simnet.mineBlock([
      airdrop(recipients1, recipients2, recipients3, simnet.deployer),
    ])[0].result;
    expect(result).toBeOk(boolCV(true));

    expect(getOwner(1)).toBeOk(someCV(principalCV(address1)));
    expect(getOwner(2)).toBeOk(someCV(principalCV(address2)));
  });

  it("increments nextId correctly after previous mints", () => {
    simnet.mineBlock([mint(simnet.deployer)]);
    expect(getLastTokenId()).toBeOk(uintCV(1));

    const recipients = [address1, address2];
    const result = simnet.mineBlock([airdrop(recipients, [], [], simnet.deployer)])[0].result;
    expect(result).toBeOk(boolCV(true));

    expect(getOwner(1)).toBeOk(someCV(principalCV(simnet.deployer)));
    expect(getOwner(2)).toBeOk(someCV(principalCV(address1)));
    expect(getOwner(3)).toBeOk(someCV(principalCV(address2)));
  });
});
