const MAX = 5;

export function createHistory() {
  /** @type {Array<{ timestamp: number, text: string, role: string }>} */
  const messages = [];

  return {
    push(role, text) {
      messages.push({
        timestamp: Math.floor(Date.now() / 1000),
        text,
        role,
      });
      while (messages.length > MAX) messages.shift();
    },
    snapshot() {
      return [...messages];
    },
  };
}
