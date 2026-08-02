import { createHash } from "node:crypto";

const normalize = (value) => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON forbids non-finite numbers.");
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => {
          if (value[key] === undefined) {
            throw new TypeError("Canonical JSON forbids undefined values.");
          }
          return [key, normalize(value[key])];
        })
    );
  }
  throw new TypeError(`Canonical JSON forbids ${typeof value} values.`);
};

/** @param {unknown} value */
export const canonicalJson = (value) => JSON.stringify(normalize(value));

/** @param {unknown} value */
export const sha256ContentIdentity = (value) =>
  `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
