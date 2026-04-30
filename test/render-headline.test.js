import test from "node:test";
import assert from "node:assert";
import { formatOffersHeadline, stripSyntheticMadeInLead } from "../src/render.js";

test("strips synthetic MadeIn speaker prefix at line start", () => {
  const h = formatOffersHeadline(
    "MadeIn, I checked 863 options and found nine one-way flights for you from LAX/BUR/SNA to RDM starting at 291 USD. Here they are.",
  );
  assert.strictEqual(
    h,
    "I checked 863 options and found nine one-way flights for you from LAX/BUR/SNA to RDM starting at 291 USD. Here they are.",
  );
});

test("prefix match is case-insensitive", () => {
  assert.strictEqual(stripSyntheticMadeInLead("madein, I checked options."), "I checked options.");
});

test("headline without synthetic prefix unchanged", () => {
  assert.strictEqual(
    formatOffersHeadline("Ada, I checked 863 options."),
    "Ada, I checked 863 options.",
  );
});

test("MadeIn not at start unchanged", () => {
  assert.strictEqual(stripSyntheticMadeInLead('See MadeIn, in the footer.'), 'See MadeIn, in the footer.');
});
