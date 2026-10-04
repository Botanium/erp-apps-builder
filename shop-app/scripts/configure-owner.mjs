import { randomBytes, scryptSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Run only by the owner, in an interactive terminal. No credentials go into argv, logs or .env.local.
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  process.stderr.write(
    "Use an interactive private terminal; piped passwords are not accepted.\n"
  );
  process.exit(1);
}
const suppliedOrigin = process.argv
  .find((value) => value.startsWith("--origin="))
  ?.slice(9);
const appOrigin = suppliedOrigin || "http://127.0.0.1:4320";
const origin = new URL(appOrigin);
if (
  origin.origin !== appOrigin ||
  origin.protocol !== "http:" ||
  !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)
)
  throw new Error(
    "Only an exact local loopback HTTP origin is accepted by this local helper."
  );

function hidden(prompt) {
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolveValue, reject) => {
    let input = "";
    const receive = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Cancelled; no owner configuration written."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolveValue(input);
          return;
        }
        if (character === "\u007f" || character === "\b")
          input = input.slice(0, -1);
        else if (character >= " " && input.length < 256) input += character;
      }
    };
    function cleanup() {
      process.stdin.off("data", receive);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    }
    process.stdin.on("data", receive);
  });
}

try {
  process.stdout.write(
    `Configure a local owner sign-in for ${appOrigin}. This does not enable AI, voice, integrations or deployment.\n`
  );
  const password = await hidden(
    "New owner password (12+ characters; hidden): "
  );
  if (password.length < 12)
    throw new Error("Use at least 12 characters. No configuration written.");
  const confirmation = await hidden("Repeat password (hidden): ");
  if (password !== confirmation)
    throw new Error("Passwords differ. No configuration written.");
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  const config = {
    passwordHash: `scrypt$${salt.toString("hex")}$${digest.toString("hex")}`,
    sessionSecret: randomBytes(32).toString("hex"),
    appOrigin,
  };
  mkdirSync(resolve(".local"), { recursive: true, mode: 0o700 });
  writeFileSync(
    resolve(".local/owner-config.json"),
    JSON.stringify(config) + "\n",
    { mode: 0o600, flag: "wx" }
  );
  process.stdout.write(
    "Local owner configuration saved privately. Existing API environment was not changed. Open the app and choose owner sign-in.\n"
  );
} catch (error) {
  process.stderr.write(
    error.code === "EEXIST"
      ? "Owner configuration already exists; it was not replaced.\n"
      : `${error.message}\n`
  );
  process.exitCode = 1;
}
