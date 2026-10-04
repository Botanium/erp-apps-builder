/** Scan only the proposed public release diff; never print matched private values. */
import { execFileSync } from "node:child_process";

const staged = process.argv.includes("--staged");
const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
if (!staged && !baseArg)
  throw new Error(
    "Use --staged or --base=<reviewed-commit> from the release repository root."
  );
const git = (args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const head = staged ? undefined : git(["rev-parse", "--verify", "HEAD"]).trim();
const args = staged
  ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]
  : [
      "diff",
      "--name-only",
      "--diff-filter=ACMR",
      "-z",
      `${baseArg.slice(7)}...${head}`,
    ];
const files = git(args).split("\0").filter(Boolean);
const violations = [];
for (const file of files) {
  if (
    /(?:^|\/)(?:node_modules|\.local|\.vercel|\.netlify|\.eve|\.output|\.next[^/]*|output|playwright-report|test-results)(?:\/|$)|\.(?:sqlite(?:-wal|-shm)?|db|mp3|wav|png|jpe?g|webp|zip)$/i.test(
      file
    ) ||
    (/(?:^|\/)\.env(?:\..*)?$/.test(file) && !file.endsWith("/.env.example")) ||
    /^shop-app\/(?:BUILD|VOICE|QA|CONTRACT|RELEASE)\.md$/.test(file) ||
    file === "shop-app/scripts/live-validation.mjs"
  ) {
    violations.push({
      file,
      reason: "private artifact or excluded local document",
    });
    continue;
  }
  const content = git(["show", staged ? `:${file}` : `${head}:${file}`]);
  const checks = [
    ["private local home path", /\/Users\/[^/\s]+\//],
    [
      "provider or project identifier",
      /\b(?:req_|resp_|team_|prj_)[A-Za-z0-9]{20,}\b/,
    ],
    [
      "credential-shaped token",
      /\b(?:sk-(?:proj-)?|ghp_|github_pat_)[A-Za-z0-9_-]{24,}\b/,
    ],
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ];
  for (const [reason, pattern] of checks)
    if (pattern.test(content)) violations.push({ file, reason });
}
console.log(
  JSON.stringify({ filesChecked: files.length, violations }, null, 2)
);
if (!files.length || violations.length) process.exitCode = 1;
