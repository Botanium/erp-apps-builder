import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = process.cwd();
function files(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(folder, entry.name))
      : [join(folder, entry.name)]
  );
}
const output = files(".next");
const traces = output.filter((file) => file.endsWith(".nft.json"));
const violations = [];
for (const trace of traces) {
  for (const file of JSON.parse(readFileSync(trace, "utf8")).files || []) {
    const path = relative(root, resolve(dirname(trace), file));
    if (
      /^(?:\.env(?:\.|$)|\.local\/|output\/|tests\/|\.next-(?:qa|e2e)\/)/.test(
        path
      )
    )
      violations.push({ trace, path });
  }
}
const clientViolations = files(".next/static").filter(
  (file) =>
    /\.(?:js|json|map)$/.test(file) &&
    /OPENAI_API_KEY|SHOP_OWNER_PASSWORD_HASH|SHOP_SESSION_SECRET|owner-config\.json/.test(
      readFileSync(file, "utf8")
    )
);
console.log(
  JSON.stringify(
    {
      tracesChecked: traces.length,
      forbiddenProjectPaths: violations,
      clientSecretIdentifierFiles: clientViolations,
    },
    null,
    2
  )
);
if (!traces.length || violations.length || clientViolations.length)
  process.exitCode = 1;
