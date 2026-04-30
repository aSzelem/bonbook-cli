import chalk from "chalk";

/**
 * @param {number} cents
 * @param {string} [currency]
 */
function money(cents, currency = "usd") {
  const sym = currency?.toLowerCase() === "usd" ? "$" : `${currency?.toUpperCase() ?? ""} `;
  const n = Number(cents);
  if (!Number.isFinite(n)) return "?";
  return `${sym}${(n / 100).toFixed(2)}`;
}

/**
 * Strip trailing BonBook day-offset suffix `+<n>` from leg times for terminal display.
 * @param {string | undefined} t
 */
export function stripDayOffset(t) {
  if (typeof t !== "string" || !t) return "?";
  return t.replace(/\+\d+$/, "");
}

/**
 * @param {number | undefined} mins
 */
function formatDurationMinutes(mins) {
  const n = Number(mins);
  if (!Number.isFinite(n) || n < 0) return "?";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * @param {{ stops?: Array<{ airport?: string }> } | undefined} leg
 */
function legStopLabel(leg) {
  const stops = leg?.stops ?? [];
  if (stops.length === 0) return "Nonstop";
  const codes = stops.map((s) => s.airport).filter(Boolean);
  const suffix = codes.length ? `: ${codes.join(", ")}` : "";
  return `${stops.length} stop${stops.length === 1 ? "" : "s"}${suffix}`;
}

/** @param {{ departureDate?: string, departureTime?: string } | undefined} leg */
function legDepartureSortKey(leg) {
  if (!leg) return "";
  const date = typeof leg.departureDate === "string" ? leg.departureDate : "";
  const time = stripDayOffset(leg.departureTime);
  return `${date}\0${time}`;
}

/**
 * Sort offers within a date group: first leg departure, then second leg tie-break.
 * @param {object} a
 * @param {object} b
 */
export function compareOfferOptions(a, b) {
  const legsA = a.legs ?? [];
  const legsB = b.legs ?? [];
  const k0a = legDepartureSortKey(legsA[0]);
  const k0b = legDepartureSortKey(legsB[0]);
  if (k0a < k0b) return -1;
  if (k0a > k0b) return 1;
  const k1a = legDepartureSortKey(legsA[1]);
  const k1b = legDepartureSortKey(legsB[1]);
  if (k1a < k1b) return -1;
  if (k1a > k1b) return 1;
  return 0;
}

function purchaseLinkBracket(url) {
  return chalk.blue(`< link: ${url} >`);
}

/**
 * Strip synthetic CLI speaker greeting `MadeIn, ` when the bridge repeats it before prose (bridge often omits `memberFirstName`, so no name-gate).
 * @param {string | undefined} text
 */
export function stripSyntheticMadeInLead(text) {
  if (typeof text !== "string" || !text) return "";
  return text.replace(/^MadeIn,\s*/i, "").trimStart();
}

/**
 * @param {string | undefined} headline
 */
export function formatOffersHeadline(headline) {
  return stripSyntheticMadeInLead(headline ?? "");
}

/**
 * Booking links are shortened on the bridge (Short.io) before the CLI sees them.
 *
 * @param {object} answer
 */
export function renderAnswer(answer) {
  if (!answer || typeof answer !== "object") {
    console.log(chalk.gray("(empty response)"));
    return;
  }

  switch (answer.kind) {
    case "message":
      console.log(stripSyntheticMadeInLead(answer.text ?? ""));
      break;

    case "offers": {
      const hl = formatOffersHeadline(answer.headline);
      if (hl) console.log(chalk.bold(hl));
      const summary = answer.summary;
      if (summary) {
        console.log(
          chalk.dim(
            `Options: ${summary.optionsFound ?? "?"} · trip ${summary.tripType ?? "?"} · ${money(summary.minTotal ?? 0, summary.currencyTotal)}–${money(summary.maxTotal ?? 0, summary.currencyTotal)}`,
          ),
        );
      }
      const groups = answer.optionGroups ?? [];
      let firstOption = true;
      const indent = "    ";
      for (const g of groups) {
        const dates = (g.dates ?? []).join(", ");
        if (dates) console.log(chalk.cyan(`Dates: ${dates}`));
        const sortedOpts = [...(g.options ?? [])].sort(compareOfferOptions);
        for (const opt of sortedOpts) {
          if (!firstOption) console.log();
          firstOption = false;
          const legs = opt.legs ?? [];
          for (const leg of legs) {
            const dep = stripDayOffset(leg.departureTime);
            const arr = stripDayOffset(leg.arrivalTime);
            const origin = leg.originAirport ?? "?";
            const dest = leg.destinationAirport ?? "?";
            const dur = formatDurationMinutes(leg.duration);
            const stops = legStopLabel(leg);
            console.log(`${dep} (${origin}) -> ${arr} (${dest}) * ${dur} * ${stops}`);
          }
          const airlines = (opt.owners ?? []).map((o) => o.shortName ?? o.iata).join(" or ") || "?";
          const price = money(opt.totalPrice, opt.totalCurrency);
          if (opt.link) {
            console.log(`${indent}${price} - ${airlines}   ${purchaseLinkBracket(opt.link)}`);
          } else {
            console.log(`${indent}${price} - ${airlines}`);
          }
        }
      }
      if (answer.current?.reference) {
        console.log(chalk.dim(`Current booking: ${answer.current.reference}`));
      }
      break;
    }

    case "booking": {
      if (answer.headline) console.log(chalk.bold(stripSyntheticMadeInLead(answer.headline)));
      const b = answer.current;
      if (b)
        console.log(
          chalk.green(
            `${b.reference ?? "?"} · ${b.bookingStatus ?? "?"} · ${money(b.totalPrice ?? 0, b.totalCurrency)}`,
          ),
        );
      break;
    }

    case "schedule_update": {
      if (answer.headline) console.log(chalk.bold(stripSyntheticMadeInLead(answer.headline)));
      console.log(chalk.yellow("Schedule change detected — compare stale vs current in BonBook / email."));
      break;
    }

    case "checkin_offer": {
      if (answer.headline) console.log(chalk.bold(stripSyntheticMadeInLead(answer.headline)));
      if (answer.link) console.log(purchaseLinkBracket(answer.link));
      break;
    }

    case "error":
      console.error(chalk.red(`${answer.code ?? "ERROR"}: ${answer.message ?? ""}`));
      break;

    default:
      console.log(chalk.gray(JSON.stringify(answer, null, 2)));
  }
}
