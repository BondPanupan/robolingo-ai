import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFetchableUrl, isPublicAddress } from "./public-address.ts";

describe("isPublicAddress", () => {
  it("blocks loopback, private, link-local/metadata, CGNAT and multicast IPv4", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.10", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1"]) {
      assert.equal(isPublicAddress(ip), false, ip);
    }
  });

  it("allows public IPv4 next to the private ranges", () => {
    for (const ip of ["8.8.8.8", "172.32.0.1", "172.15.255.255", "192.169.0.1", "1.1.1.1"]) {
      assert.equal(isPublicAddress(ip), true, ip);
    }
  });

  it("handles IPv6 including IPv4-mapped addresses", () => {
    assert.equal(isPublicAddress("::1"), false);
    assert.equal(isPublicAddress("fd00::1"), false);
    assert.equal(isPublicAddress("fe80::1"), false);
    assert.equal(isPublicAddress("::ffff:127.0.0.1"), false);
    assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
  });
});

describe("isFetchableUrl", () => {
  it("rejects non-http schemes, odd ports, credentials and internal hosts without DNS", async () => {
    for (const url of [
      "file:///etc/passwd",
      "http://localhost/",
      "http://127.0.0.1/",
      "http://[::1]/",
      "http://169.254.169.254/latest/meta-data/",
      "http://example.com:8080/",
      "http://user:pass@example.com/",
      "http://mongodb:27017/",
      "http://web.internal/",
    ]) {
      assert.equal(await isFetchableUrl(new URL(url)), false, url);
    }
  });

  it("accepts a public IP literal", async () => {
    assert.equal(await isFetchableUrl(new URL("https://1.1.1.1/")), true);
  });
});
