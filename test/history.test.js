import test from "node:test";
import assert from "node:assert";
import { createHistory } from "../src/history.js";

test("history caps at 5", () => {
  const h = createHistory();
  for (let i = 0; i < 10; i++) h.push("user", String(i));
  assert.strictEqual(h.snapshot().length, 5);
  assert.strictEqual(h.snapshot()[0].text, "5");
});
