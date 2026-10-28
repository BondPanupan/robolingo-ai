import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { firstLink, linkify } from "./linkify.ts";

describe("linkify", () => {
  it("splits text and links, keeping the surrounding text", () => {
    assert.deepEqual(linkify("ดูสถานะที่ https://booking.example.com/s/BKK-1 นะคะ"), [
      { kind: "text", text: "ดูสถานะที่ " },
      { kind: "link", text: "https://booking.example.com/s/BKK-1", href: "https://booking.example.com/s/BKK-1" },
      { kind: "text", text: " นะคะ" },
    ]);
  });

  it("leaves sentence punctuation outside the link but keeps balanced parentheses", () => {
    assert.equal(firstLink("ดูที่ https://a.example.com/x."), "https://a.example.com/x");
    assert.equal(firstLink("(https://a.example.com/x)"), "https://a.example.com/x");
    assert.equal(firstLink("https://en.wikipedia.org/wiki/Foo_(bar)"), "https://en.wikipedia.org/wiki/Foo_(bar)");
  });

  it("returns plain text untouched and finds no link", () => {
    assert.deepEqual(linkify("สวัสดีค่ะ"), [{ kind: "text", text: "สวัสดีค่ะ" }]);
    assert.equal(firstLink("ftp://x.example.com www.example.com"), null);
  });

  it("returns the first of several links", () => {
    assert.equal(firstLink("https://one.example.com และ https://two.example.com"), "https://one.example.com");
  });
});
