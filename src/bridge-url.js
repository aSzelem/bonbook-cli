const DEFAULT_BRIDGE = "https://bonbook-cli.uc.r.appspot.com";

/** Resolved base URL (`BONBOOK_BRIDGE_URL` or production default). */
export const BRIDGE_BASE_URL =
  (process.env.BONBOOK_BRIDGE_URL && String(process.env.BONBOOK_BRIDGE_URL).trim()) ||
  DEFAULT_BRIDGE;
