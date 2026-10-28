import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferCustomerReadAt } from "./infer-customer-read-at.ts";

type Row = Parameters<typeof inferCustomerReadAt>[0][number];

const at = (minute: number) => new Date(Date.UTC(2026, 9, 28, 13, minute));
const row = (id: string, direction: "inbound" | "outbound", minute: number) =>
  ({ _id: id, direction, createdAt: at(minute) }) as unknown as Row;

describe("inferCustomerReadAt", () => {
  it("marks outbound messages read at the first customer reply after them", () => {
    const readAt = inferCustomerReadAt([
      row("in1", "inbound", 0),
      row("out1", "outbound", 1),
      row("out2", "outbound", 2),
      row("in2", "inbound", 5),
      row("out3", "outbound", 6),
      row("in3", "inbound", 9),
    ]);
    assert.deepEqual(readAt.get("out1"), at(5));
    assert.deepEqual(readAt.get("out2"), at(5));
    assert.deepEqual(readAt.get("out3"), at(9));
  });

  it("leaves messages after the last reply unknown and never marks inbound", () => {
    const readAt = inferCustomerReadAt([row("in1", "inbound", 0), row("out1", "outbound", 1)]);
    assert.equal(readAt.has("out1"), false);
    assert.equal(readAt.has("in1"), false);
  });

  it("returns nothing for an empty chat", () => {
    assert.equal(inferCustomerReadAt([]).size, 0);
  });
});
