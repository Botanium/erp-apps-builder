// Local qualification only: allow loopback/Unix IPC, never provider, telemetry or cloud API egress.
import net from "node:net";
import { syncBuiltinESMExports } from "node:module";
const local = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const values = Array.isArray(args[0]) ? args[0] : args;
  const options = typeof values[0] === "object" ? values[0] : {host: typeof values[1] === "string" ? values[1] : undefined};
  if (options?.host && !local.has(options.host)) throw new Error("Qualification blocked non-loopback socket");
  return originalConnect.apply(this, args);
};
syncBuiltinESMExports();
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (!local.has(url.hostname)) throw new Error("Qualification blocked non-loopback fetch");
  return originalFetch(input, init);
};
