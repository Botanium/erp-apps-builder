// Test-process boundary: never allow a real provider request, even after a regression.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url
  );
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error(`E2E blocked external fetch to ${url.hostname}`);
  }
  return originalFetch(input, init);
};
