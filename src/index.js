import crypto from "crypto";
import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { getStore, maskKey } from "./config.js";
import { BRIDGE_BASE_URL } from "./bridge-url.js";
import { createHistory } from "./history.js";
import { postAsk, getJob } from "./bridge-client.js";
import { renderAnswer, formatOffersHeadline } from "./render.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

function readPkgVersion() {
  try {
    const p = fileURLToPath(new URL("../package.json", import.meta.url));
    const j = JSON.parse(readFileSync(p, "utf8"));
    return j.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const POLL_MS = parseInt(process.env.BONBOOK_POLL_INTERVAL_MS ?? "2000", 10);
const TIMEOUT_MS = parseInt(process.env.BONBOOK_POLL_TIMEOUT_MS ?? "120000", 10);

/**
 * Single ora spinner (no extra trailing dots — spinner glyph is enough).
 * @param {{ base: string; taskSuffix: string }} state
 */
function createStatusSpinner(state) {
  const spinner = ora({
    spinner: "dots",
    text: `${state.base}${state.taskSuffix}`,
    discardStdin: true,
  }).start();

  function syncText() {
    spinner.text = `${state.base}${state.taskSuffix}`;
  }

  return {
    spinner,
    /** Clears ora’s interval and spinner line (`stop()` handles both). */
    stopQuiet() {
      spinner.stop();
    },
    fail(message) {
      spinner.fail(message);
    },
    updateBase(base) {
      state.base = base;
      syncText();
    },
    updateTaskSuffix(suffix) {
      state.taskSuffix = suffix;
      syncText();
    },
  };
}

/**
 * @param {string[]} argv
 */
export async function runCli(argv) {
  const program = new Command();
  program.name("bonbook").description("BonBook CLI (via bridge)").version(readPkgVersion());

  program
    .command("set-key")
    .description("Save your cli-key locally")
    .argument("<cli-key>", "Per-install cli-key from ops")
    .action((key) => {
      const store = getStore();
      const trimmed = key.trim();
      store.set("cliKey", trimmed);
      console.log(chalk.green(`cliKey saved (${maskKey(trimmed)}).`));
    });

  program
    .command("ask")
    .argument("<text...>", "Natural language request")
    .option("-v, --verbose", "Print correlationId / taskId")
    .action(async (textParts, opts) => {
      const text = textParts.join(" ").trim();
      if (!text) {
        console.error(chalk.red("Provide non-empty text."));
        process.exitCode = 1;
        return;
      }

      const store = getStore();
      const cliKey = store.get("cliKey");
      if (!cliKey) {
        console.error(chalk.red("Run `bonbook set-key <key>` first."));
        process.exitCode = 1;
        return;
      }

      const bridgeUrl = BRIDGE_BASE_URL;

      const history = createHistory();
      const conversationID = crypto.randomUUID();

      const body = {
        text,
        conversationID,
        context: { messages: history.snapshot() },
      };

      history.push("user", text);

      const spinState = { base: "Reading...", taskSuffix: "" };
      const ui = createStatusSpinner(spinState);

      let initial;
      try {
        initial = await postAsk(bridgeUrl, cliKey, body);
      } catch (e) {
        ui.fail(e instanceof Error ? e.message : String(e));
        process.exitCode = 1;
        return;
      }

      if (!initial.res.ok) {
        ui.fail(initial.json?.error?.message ?? initial.json?._raw ?? initial.res.statusText);
        process.exitCode = 1;
        return;
      }

      const init = initial.json;
      if (opts.verbose && init.correlationId) {
        console.error(chalk.dim(`correlationId: ${init.correlationId}`));
      }

      if (init.status === "complete" && init.answer) {
        ui.stopQuiet();
        renderAnswer(init.answer);
        history.push("assistant", summarizeAnswer(init.answer));
        return;
      }

      if (init.status !== "processing" || !init.correlationId) {
        ui.fail("Unexpected bridge response");
        process.exitCode = 1;
        return;
      }

      const interim = typeof init.interimMessage === "string" && init.interimMessage.trim() ? init.interimMessage.trim() : "Working on your request";
      ui.updateBase(interim);

      const start = Date.now();
      let lastMsg = interim;

      while (Date.now() - start < TIMEOUT_MS) {
        await sleep(POLL_MS);
        const polled = await getJob(bridgeUrl, cliKey, init.correlationId);
        if (!polled.res.ok) {
          ui.fail(polled.json?.error?.message ?? "Poll failed");
          process.exitCode = 1;
          return;
        }

        const job = polled.json;
        if (job.interimMessage && job.interimMessage.trim() && job.interimMessage.trim() !== lastMsg) {
          lastMsg = job.interimMessage.trim();
          ui.updateBase(lastMsg);
        }

        ui.updateTaskSuffix(opts.verbose && job.taskId ? ` (task ${job.taskId})` : "");

        if (job.status === "complete" && job.answer) {
          ui.stopQuiet();
          renderAnswer(job.answer);
          history.push("assistant", summarizeAnswer(job.answer));
          return;
        }

        if (job.status === "failed") {
          ui.fail(job.error?.message ?? "Failed");
          if (job.error?.code) console.error(chalk.red(job.error.code));
          process.exitCode = 1;
          return;
        }
      }

      ui.fail("Timed out waiting for BonBook");
      process.exitCode = 1;
    });

  await program.parseAsync(argv);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {object} answer
 */
function summarizeAnswer(answer) {
  if (answer.kind === "message") return answer.text ?? "";
  if (answer.kind === "offers")
    return formatOffersHeadline(answer.headline ?? "") || "Offers returned.";
  if (answer.kind === "booking") return answer.headline ?? "Booking update.";
  return answer.kind ?? "Response.";
}
