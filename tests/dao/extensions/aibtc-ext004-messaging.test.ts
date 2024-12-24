import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const deployer = accounts.get("deployer")!;

enum ErrCode {
  ERR_UNAUTHORIZED = 4000,
}

type MessageEnvelope = {
  caller: string;
  height: number;
  isFromDao: boolean;
  sender: string;
};

describe("aibtc-ext004-messaging", () => {
  const message = "Hello, world!";

  it("send() succeeds if called by any user with isFromDao false", () => {
    const response = simnet.callPublicFn(
      "aibtc-ext004-messaging",
      "send",
      [Cl.stringAscii(message), Cl.bool(false)],
      address1
    );

    const expectedEnvelope: MessageEnvelope = {
      caller: address1,
      height: simnet.blockHeight,
      isFromDao: false,
      sender: address1,
    };

    const envelopeEvent = cvToValue(response.events[1].data.value!);
    const actualEnvelope = {
      caller: envelopeEvent.caller.value,
      height: Number(envelopeEvent.height.value),
      isFromDao: envelopeEvent.isFromDao.value,
      sender: envelopeEvent.sender.value,
    };

    expect(response.events[0].data.value).toEqual(message);
    expect(actualEnvelope).toEqual(expectedEnvelope);
    expect(response.result).toBeOk(Cl.bool(true));
  });

  it("send() fails if called by any user with isFromDao true", () => {
    const response = simnet.callPublicFn(
      "aibtc-ext004-messaging",
      "send",
      [Cl.stringAscii(message), Cl.bool(true)],
      address1
    );

    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("send() succeeds if called by a DAO proposal with isFromDao true", () => {
    // TODO: Implement this test after DAO proposal mechanism is in place
    // Will need to create and execute a proposal that calls send()
    // with isFromDao true
  });
});
