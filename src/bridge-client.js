/**
 * @param {string} bridgeUrl
 * @param {string} cliKey
 * @param {object} body
 */
export async function postAsk(bridgeUrl, cliKey, body) {
  const url = `${bridgeUrl.replace(/\/$/, "")}/v1/ask`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cliKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { res, json };
}

/**
 * @param {string} bridgeUrl
 * @param {string} cliKey
 * @param {string} correlationId
 */
export async function getJob(bridgeUrl, cliKey, correlationId) {
  const url = `${bridgeUrl.replace(/\/$/, "")}/v1/jobs/${encodeURIComponent(correlationId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${cliKey}` },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { res, json };
}
