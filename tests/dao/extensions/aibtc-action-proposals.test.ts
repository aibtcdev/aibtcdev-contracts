import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ActionProposalsErrCode } from "../../error-codes";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-action-proposals";
const contractAddress = `${deployer}.${contractName}`;

const votingPeriod = 144; // 24 hours in BTC blocks
const votingQuorum = 66; // 66% quorum

const ErrCode = ActionProposalsErrCode;

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
  // Proposal Tests
  describe("propose-action()", () => {
    it("fails if contract not initialized", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_INITIALIZED));
    });

    it("fails if token mismatches", () => {
      // First set the treasury and token
      simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(deployer, "test-treasury")],
        deployer
      );

      simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(deployer, "test-token")],
        deployer
      );

      const receipt = simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "wrong-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_TOKEN_MISMATCH));
    });

    it("fails if caller has no balance", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
    });

    it("fails if action is invalid", () => {
      // Mock some balance for the caller

      simnet.callPublicFn(
        `${deployer}.test-token`,
        "mint",
        [Cl.uint(1000000), Cl.standardPrincipal(address1)],
        deployer
      );

      const receipt = simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("invalid-action"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
    });

    it("fails if parameters are invalid", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([]), // Empty parameters
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMETERS));
    });

    it("succeeds and creates new proposal", () => {
      // Mock some balance for the caller
      simnet.callPublicFn(
        `${deployer}.test-token`,
        "mint",
        [Cl.uint(1000000), Cl.standardPrincipal(address1)],
        deployer
      );

      const receipt = simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeOk(Cl.uint(1));

      // Verify proposal was created
      const getReceipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-total-proposals",
        [],
        deployer
      );
      expect(getReceipt.result).toBeOk(Cl.uint(1));

      // Verify proposal details
      const proposalReceipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );
      const proposal = proposalReceipt.result.expectSome().expectTuple();
      expect(proposal.action).toBe("send-message");
      expect(proposal.concluded).toBe(false);
      expect(proposal.passed).toBe(false);
      expect(proposal.votesFor).toBe(0);
      expect(proposal.votesAgainst).toBe(0);
    });
    */
});

/*
  // Voting Tests
  describe("vote-on-proposal()", () => {
    
    it("fails if contract not initialized", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_INITIALIZED));
    });

    it("fails if token mismatches", () => {
      // First set the treasury and token
      simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(deployer, "test-treasury")],
        deployer
      );

      simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(deployer, "test-token")],
        deployer
      );

      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "wrong-token"),
          Cl.bool(true),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_TOKEN_MISMATCH));
    });

    it("fails if caller has no balance", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
    });

    it("fails if voting too soon", () => {
      // Mock some balance for the caller
      simnet.callPublicFn(
        `${deployer}.test-token`,
        "mint",
        [Cl.uint(1000000), Cl.standardPrincipal(address1)],
        deployer
      );

      // Create a proposal
      simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );

      // Try to vote before start block
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_SOON));
    });

    it("fails if voting too late", () => {
      // Mine blocks past the voting period
      simnet.mineEmptyBlocks(145);

      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_LATE));
    });

    it("fails if proposal concluded", () => {
      // Conclude the proposal
      simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "test-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );

      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );
      expect(receipt.result).toBeErr(
        Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
      );
    });

    it("fails if already voted", () => {
      // Create a new proposal
      simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );

      // Vote once
      simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(2),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );

      // Try to vote again
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(2),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_ALREADY_VOTED));
    });

    it("succeeds and records vote", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(2),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address2
      );
      expect(receipt.result).toBeOk(Cl.bool(true));

      // Verify vote was recorded
      const getReceipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-total-votes",
        [Cl.uint(2), Cl.standardPrincipal(address2)],
        deployer
      );
      expect(getReceipt.result).toBeOk(Cl.uint(1000000));
    });
  });

  // Conclusion Tests
  describe("conclude-proposal()", () => {
    it("fails if contract not initialized", () => {
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "test-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_INITIALIZED));
    });

    it("fails if treasury mismatches", () => {
      // First set the treasury and token
      simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(deployer, "test-treasury")],
        deployer
      );

      simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(deployer, "test-token")],
        deployer
      );

      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(1),
          Cl.contractPrincipal(deployer, "wrong-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_TREASURY_MISMATCH));
    });

    it("fails if proposal still active", () => {
      // Create a new proposal
      simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );

      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(3),
          Cl.contractPrincipal(deployer, "test-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(
        Cl.uint(ErrCode.ERR_PROPOSAL_STILL_ACTIVE)
      );
    });

    it("fails if proposal already concluded", () => {
      // Mine blocks to end voting period
      simnet.mineEmptyBlocks(144);

      // Conclude the proposal first time
      simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(3),
          Cl.contractPrincipal(deployer, "test-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );

      // Try to conclude again
      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(3),
          Cl.contractPrincipal(deployer, "test-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeErr(
        Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
      );
    });

    it("succeeds and executes if passed", () => {
      // Create a new proposal
      simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );

      // Vote in favor with enough tokens to pass
      simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(4),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(true),
        ],
        address1
      );

      // Mine blocks to end voting period
      simnet.mineEmptyBlocks(144);

      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(4),
          Cl.contractPrincipal(deployer, "test-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBeOk(Cl.bool(true));
    });

    it("succeeds without executing if failed", () => {
      // Create a new proposal
      simnet.callPublicFn(
        contractAddress,
        "propose-action",
        [
          Cl.stringAscii("send-message"),
          Cl.list([Cl.stringUtf8("Hello World")]),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );

      // Vote against with enough tokens to fail
      simnet.callPublicFn(
        contractAddress,
        "vote-on-proposal",
        [
          Cl.uint(5),
          Cl.contractPrincipal(deployer, "test-token"),
          Cl.bool(false),
        ],
        address1
      );

      // Mine blocks to end voting period
      simnet.mineEmptyBlocks(144);

      const receipt = simnet.callPublicFn(
        contractAddress,
        "conclude-proposal",
        [
          Cl.uint(5),
          Cl.contractPrincipal(deployer, "test-treasury"),
          Cl.contractPrincipal(deployer, "test-token"),
        ],
        address1
      );
      expect(receipt.result).toBe(Cl.bool(false));
    });
  });

  // Getter Tests
  describe("get-voting-period()", () => {
    it("returns the correct voting period", () => {
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-voting-period",
        [],
        deployer
      );
      expect(receipt.result).toBe(Cl.uint(144)); // 144 blocks, ~1 day
    });
  });

  describe("get-voting-quorum()", () => {
    it("returns the correct voting quorum", () => {
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-voting-quorum",
        [],
        deployer
      );
      expect(receipt.result).toBe(Cl.uint(66)); // 66% of liquid supply
    });
  });

  describe("is-initialized()", () => {
    it("returns false when treasury and token not set", () => {
      // Reset contract state
      simnet.mineBlock([]);

      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "is-initialized",
        [],
        deployer
      );
      expect(receipt.result).toBeBool(false);
    });

    it("returns true when treasury and token are set", () => {
      // Set treasury and token
      simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(deployer, "test-treasury")],
        deployer
      );
      simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(deployer, "test-token")],
        deployer
      );

      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "is-initialized",
        [],
        deployer
      );
      expect(receipt.result).toBeBool(true);
    });
  });

  describe("get-protocol-treasury()", () => {
    it("returns none when treasury not set", () => {
      // Reset contract state
      simnet.mineBlock([]);

      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-protocol-treasury",
        [],
        deployer
      );
      expect(receipt.result).toBe(Cl.none());
    });

    it("returns some with treasury address when set", () => {
      // Set treasury
      simnet.callPublicFn(
        contractAddress,
        "set-protocol-treasury",
        [Cl.contractPrincipal(deployer, "test-treasury")],
        deployer
      );

      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-protocol-treasury",
        [],
        deployer
      );
      expect(receipt.result).toBeOk(
        Cl.some(Cl.contractPrincipal(deployer, "test-treasury"))
      );
    });
  });

  describe("get-voting-token()", () => {
    it("returns none when token not set", () => {
      // Reset contract state
      simnet.mineBlock([]);

      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-voting-token",
        [],
        deployer
      );
      expect(receipt.result).toBe(Cl.none());
    });

    it("returns some with token address when set", () => {
      // Set token
      simnet.callPublicFn(
        contractAddress,
        "set-voting-token",
        [Cl.contractPrincipal(deployer, "test-token")],
        deployer
      );

      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-voting-token",
        [],
        deployer
      );
      expect(receipt.result).toBeOk(
        Cl.some(Cl.contractPrincipal(deployer, "test-token"))
      );
    });
  });

  describe("get-proposal()", () => {
    it("returns none for non-existent proposal", () => {
      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-proposal",
        [Cl.uint(999)],
        deployer
      );
      expect(receipt.result).toBeOk(Cl.none());
    });

    it("returns proposal details for existing proposal", () => {
      // Create a proposal first
        simnet.callPublicFn(
          contractAddress,
          "propose-action",
          [
            Cl.stringAscii("send-message"),
            Cl.list([Cl.stringUtf8("Hello World")]),
            Cl.contractPrincipal(deployer, "test-token"),
          ],
          address1
        ),

      const receipt = simnet.callReadOnlyFn(
        contractAddress,
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );

      const proposal = receipt.result.expectOk().expectSome().expectTuple();
      expect(proposal.action).toBe("send-message");
      expect(proposal.concluded).toBe(false);
      expect(proposal.passed).toBe(false);
      expect(proposal.votesFor).toBe(0);
      expect(proposal.votesAgainst).toBe(0);
    });
    
  });
  */

describe("get-total-proposals()", () => {
  it("returns 0 when no proposals exist", () => {
    // Reset contract state
    simnet.mineBlock([]);

    const receipt = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt.result).toStrictEqual(Cl.uint(0));
  });

  /*
  it("returns correct count after creating proposals", () => {
    // Create two proposals
    simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [
        Cl.stringAscii("send-message"),
        Cl.list([Cl.stringUtf8("First")]),
        Cl.contractPrincipal(deployer, "test-token"),
      ],
      address1
    );
    simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [
        Cl.stringAscii("send-message"),
        Cl.list([Cl.stringUtf8("Second")]),
        Cl.contractPrincipal(deployer, "test-token"),
      ],
      address1
    );

    const receipt = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-proposals",
      [],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.uint(2));
  });
  */
});

describe("get-total-votes()", () => {
  it("returns 0 for proposal with no votes", () => {
    const receipt = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-votes",
      [Cl.uint(1), Cl.standardPrincipal(address1)],
      deployer
    );
    expect(receipt.result).toStrictEqual(Cl.uint(0));
  });

  /*
  it("returns correct vote amount for proposal with votes", () => {
    // Create proposal and vote
    simnet.callPublicFn(
      contractAddress,
      "propose-action",
      [
        Cl.stringAscii("send-message"),
        Cl.list([Cl.stringUtf8("Hello World")]),
        Cl.contractPrincipal(deployer, "test-token"),
      ],
      address1
    );
    simnet.callPublicFn(
      contractAddress,
      "vote-on-proposal",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "test-token"), Cl.bool(true)],
      address1
    );

    const receipt = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-votes",
      [Cl.uint(1), Cl.standardPrincipal(address1)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.uint(1000000)); // Amount from previous mint
  });
  */
});

describe("get-voting-period()", () => {
  it("returns the correct voting period", () => {
    const receipt = simnet.callReadOnlyFn(
      contractAddress,
      "get-voting-period",
      [],
      deployer
    );
    expect(receipt.result).toStrictEqual(Cl.uint(144)); // 144 blocks, ~1 day
  });
});

describe("get-voting-quorum()", () => {
  it("returns the correct voting quorum", () => {
    const receipt = simnet.callReadOnlyFn(
      contractAddress,
      "get-voting-quorum",
      [],
      deployer
    );
    expect(receipt.result).toStrictEqual(Cl.uint(66)); // 66% of liquid supply
  });
});
