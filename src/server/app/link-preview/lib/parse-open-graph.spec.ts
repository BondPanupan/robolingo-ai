import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseOpenGraph } from "./parse-open-graph.ts";

const PAGE = "https://shop.example.com/status/BKK-1";

describe("parseOpenGraph", () => {
  it("reads og:* in any attribute order and quote style, decoding entities", () => {
    const html = `<head>
      <meta property="og:title" content="สถานะการจอง &middot; Bistro De L&#39;Aurore">
      <meta content='เข้าสู่ระบบจัดการร้าน &amp; ดูคิว' property='og:description' />
      <meta property=og:image content="/og/cover.png">
      <meta property="og:site_name" content="Saveurnote">
    </head>`;
    assert.deepEqual(parseOpenGraph(html, PAGE), {
      title: "สถานะการจอง · Bistro De L'Aurore",
      description: "เข้าสู่ระบบจัดการร้าน & ดูคิว",
      image: "https://shop.example.com/og/cover.png",
      siteName: "Saveurnote",
    });
  });

  it("falls back to twitter:* and <title>, and keeps the first og:image", () => {
    const html = `<title> Plain   title </title>
      <meta name="twitter:description" content="tw desc">
      <meta property="og:image" content="https://cdn.example.com/1.jpg">
      <meta property="og:image" content="https://cdn.example.com/2.jpg">`;
    const og = parseOpenGraph(html, PAGE);
    assert.equal(og.title, "Plain title");
    assert.equal(og.description, "tw desc");
    assert.equal(og.image, "https://cdn.example.com/1.jpg");
  });

  it("drops non-http images and returns nulls for a page without metadata", () => {
    assert.equal(parseOpenGraph(`<meta property="og:image" content="javascript:alert(1)">`, PAGE).image, null);
    assert.deepEqual(parseOpenGraph("<p>hi</p>", PAGE), { title: null, description: null, image: null, siteName: null });
  });

  it("truncates very long titles", () => {
    const og = parseOpenGraph(`<meta property="og:title" content="${"ก".repeat(500)}">`, PAGE);
    assert.equal(og.title?.length, 200);
    assert.ok(og.title?.endsWith("…"));
  });
});
