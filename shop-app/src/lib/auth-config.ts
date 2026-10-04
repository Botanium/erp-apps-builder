import {
  closeSync,
  constants,
  fstatSync,
  openSync,
  readFileSync,
} from "node:fs";
import { resolve } from "node:path";

export type OwnerConfig = {
  passwordHash: string;
  sessionSecret: string;
  appOrigin: string;
};
function validate(config: OwnerConfig): OwnerConfig {
  if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(config.passwordHash || ""))
    throw new Error("MISSING: valid owner password hash");
  if (!/^[a-f0-9]{64,128}$/.test(config.sessionSecret || ""))
    throw new Error(
      "MISSING: owner session secret of 64–128 lowercase hexadecimal characters"
    );
  let origin: URL;
  try {
    origin = new URL(config.appOrigin);
  } catch {
    throw new Error("MISSING: valid SHOP_APP_ORIGIN");
  }
  if (
    origin.origin !== config.appOrigin ||
    origin.username ||
    origin.password ||
    !["http:", "https:"].includes(origin.protocol)
  )
    throw new Error("MISSING: exact application origin without path");
  const hosted =
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  if (hosted && origin.protocol !== "https:")
    throw new Error("MISSING: HTTPS hosted application origin");
  if (
    !hosted &&
    origin.protocol !== "https:" &&
    !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)
  )
    throw new Error("Local owner HTTP origin must be loopback");
  return config;
}

/** Secrets are server-only. Hosted deployments never read local fallback credentials. */
export function getOwnerConfig(): OwnerConfig {
  const passwordHash = process.env.SHOP_OWNER_PASSWORD_HASH;
  const sessionSecret = process.env.SHOP_SESSION_SECRET;
  const appOrigin = process.env.SHOP_APP_ORIGIN;
  if (passwordHash || sessionSecret || appOrigin)
    return validate({
      passwordHash: passwordHash || "",
      sessionSecret: sessionSecret || "",
      appOrigin: appOrigin || "",
    });
  if (process.env.NODE_ENV === "production" || process.env.VERCEL)
    throw new Error("MISSING: hosted owner environment configuration");
  let descriptor: number | undefined;
  try {
    descriptor = openSync(
      resolve(".local/owner-config.json"),
      constants.O_RDONLY | constants.O_NOFOLLOW
    );
    const stat = fstatSync(descriptor);
    if (
      !stat.isFile() ||
      (stat.mode & 0o077) !== 0 ||
      stat.size > 4096 ||
      (process.getuid && stat.uid !== process.getuid())
    )
      throw new Error(
        "Owner configuration must be a private owner-readable file"
      );
    const input = JSON.parse(readFileSync(descriptor, "utf8")) as OwnerConfig;
    return validate(input);
  } catch (error) {
    // An unconfigured local runtime still supports explicit synthetic preview.
    // Owner authentication separately requires every field to be nonempty.
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { passwordHash: "", sessionSecret: "", appOrigin: "" };
    throw error;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}
