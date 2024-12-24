import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;

type MessageEnvelope = {
  caller: string;
  height: number;
  sender: string;
};

describe("aibtc-ext004-messaging", () => {
  const message = "Hello, world!";
  it("prints the envelope and message when called", () => {
    const response = simnet.callPublicFn(
      "aibtc-ext004-messaging",
      "send",
      [Cl.stringAscii(message)],
      address1
    );

    // first event should be the envelope
    const expectedEnvelope: MessageEnvelope = {
      caller: address1,
      height: simnet.blockHeight,
      sender: address1,
    };

    const envelopeEvent = cvToValue(response.events[0].data.value!);
    const actualEnvelope = {
      caller: envelopeEvent.caller.value,
      height: Number(envelopeEvent.height.value),
      sender: envelopeEvent.sender.value,
    };
    expect(actualEnvelope).toEqual(expectedEnvelope);

    expect(response.result).toBeOk(Cl.bool(true));
  });
});
