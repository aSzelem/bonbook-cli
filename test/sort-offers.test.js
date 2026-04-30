import test from "node:test";
import assert from "node:assert";
import { compareOfferOptions } from "../src/render.js";

test("compareOfferOptions sorts by first leg departure then second", () => {
  const a = {
    legs: [
      {
        departureDate: "2026-05-12",
        departureTime: "14:00+0",
        arrivalTime: "16:00+0",
        originAirport: "SEA",
        destinationAirport: "SFO",
        duration: 120,
        stops: [],
      },
    ],
  };
  const b = {
    legs: [
      {
        departureDate: "2026-05-12",
        departureTime: "08:00+0",
        arrivalTime: "10:00+0",
        originAirport: "SEA",
        destinationAirport: "SFO",
        duration: 120,
        stops: [],
      },
    ],
  };
  assert.strictEqual(compareOfferOptions(a, b), 1);
  assert.strictEqual(compareOfferOptions(b, a), -1);
});

test("compareOfferOptions tie-break on second leg", () => {
  const lateSecond = {
    legs: [
      {
        departureDate: "2026-05-12",
        departureTime: "08:00+0",
        arrivalTime: "10:00+0",
        originAirport: "SEA",
        destinationAirport: "DEN",
        duration: 120,
        stops: [],
      },
      {
        departureDate: "2026-05-12",
        departureTime: "18:00+0",
        arrivalTime: "20:00+0",
        originAirport: "DEN",
        destinationAirport: "JFK",
        duration: 180,
        stops: [],
      },
    ],
  };
  const earlySecond = {
    legs: [
      {
        departureDate: "2026-05-12",
        departureTime: "08:00+0",
        arrivalTime: "10:00+0",
        originAirport: "SEA",
        destinationAirport: "DEN",
        duration: 120,
        stops: [],
      },
      {
        departureDate: "2026-05-12",
        departureTime: "12:00+0",
        arrivalTime: "14:00+0",
        originAirport: "DEN",
        destinationAirport: "JFK",
        duration: 180,
        stops: [],
      },
    ],
  };
  assert.strictEqual(compareOfferOptions(lateSecond, earlySecond), 1);
});
