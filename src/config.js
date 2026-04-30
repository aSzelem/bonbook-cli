import Conf from "conf";

const schema = {
  cliKey: {
    type: "string",
    default: "",
  },
};

export function getStore() {
  return new Conf({
    projectName: "bonbook-cli",
    schema,
  });
}

export function maskKey(key) {
  if (!key || key.length < 8) return "****";
  return `****${key.slice(-4)}`;
}
