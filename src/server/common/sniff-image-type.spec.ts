import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sniffImageType } from "./sniff-image-type.ts";

describe("sniffImageType", () => {
  it("detects JPEG and PNG from magic bytes", () => {
    assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1])), "image/jpeg");
    assert.equal(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
  });

  it("rejects anything else, whatever the client claimed", () => {
    assert.equal(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>")), null);
    assert.equal(sniffImageType(new TextEncoder().encode("GIF89a")), null);
    assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8])), null);
    assert.equal(sniffImageType(new Uint8Array()), null);
  });
});
