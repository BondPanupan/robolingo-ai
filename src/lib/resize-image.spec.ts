import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitWithin } from "./resize-image.ts";

describe("fitWithin", () => {
  it("scales the long edge down to the limit and keeps the aspect ratio", () => {
    assert.deepEqual(fitWithin(4032, 3024, 2048), { width: 2048, height: 1536 });
    assert.deepEqual(fitWithin(3024, 4032, 2048), { width: 1536, height: 2048 });
    assert.deepEqual(fitWithin(4000, 1000, 480), { width: 480, height: 120 });
  });

  it("never upscales small images", () => {
    assert.deepEqual(fitWithin(800, 600, 2048), { width: 800, height: 600 });
  });

  it("keeps at least 1px for extreme panoramas", () => {
    assert.deepEqual(fitWithin(100000, 10, 480), { width: 480, height: 1 });
  });
});
