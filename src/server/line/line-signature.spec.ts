// npm test — ใช้ node:test ที่มากับ Node (ไม่ต้องลง test runner เพิ่ม)

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { signLineBody, verifyLineSignature } from "./line-signature.ts";

const SECRET = "test-channel-secret";
const BODY = JSON.stringify({
  destination: "U00000000000000000000000000000000",
  events: [{ type: "message", message: { id: "1", type: "text", text: "สวัสดีค่ะ 👋" } }],
});

describe("verifyLineSignature", () => {
  it("matches LINE's spec: base64(HMAC-SHA256(secret, body))", () => {
    const expected = createHmac("sha256", SECRET).update(BODY).digest("base64");
    assert.equal(signLineBody(BODY, SECRET), expected);
  });

  it("accepts a valid signature, including non-ASCII bodies", () => {
    assert.equal(verifyLineSignature(BODY, signLineBody(BODY, SECRET), SECRET), true);
  });

  it("rejects a body that changed after signing", () => {
    const signature = signLineBody(BODY, SECRET);
    assert.equal(verifyLineSignature(BODY.replace("สวัสดี", "ลาก่อน"), signature, SECRET), false);
  });

  it("rejects a re-serialized body even when the JSON is equal", () => {
    const signature = signLineBody(BODY, SECRET);
    const reformatted = JSON.stringify(JSON.parse(BODY), null, 2);
    assert.equal(verifyLineSignature(reformatted, signature, SECRET), false);
  });

  it("rejects a signature made with another secret", () => {
    assert.equal(verifyLineSignature(BODY, signLineBody(BODY, "other-secret"), SECRET), false);
  });

  it("rejects missing, empty or malformed signatures without throwing", () => {
    for (const signature of [null, undefined, "", "abc", "x".repeat(44)]) {
      assert.equal(verifyLineSignature(BODY, signature, SECRET), false);
    }
  });

  it("rejects everything when the channel secret is not set", () => {
    assert.equal(verifyLineSignature(BODY, signLineBody(BODY, ""), ""), false);
  });
});
