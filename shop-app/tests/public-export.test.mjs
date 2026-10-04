import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("public export guard accepts staged source and rejects private metadata without echoing its value", () => {
  const folder = mkdtempSync(join(tmpdir(), "shop-public-export-"));
  const checker = fileURLToPath(
    new URL("../scripts/verify-public.mjs", import.meta.url)
  );
  const git = (args) =>
    execFileSync("git", args, { cwd: folder, stdio: "pipe" });
  try {
    git(["init", "--quiet"]);
    mkdirSync(join(folder, "shop-app"));
    writeFileSync(
      join(folder, "shop-app", "README.md"),
      "Synthetic public source. No credentials."
    );
    writeFileSync(
      join(folder, "shop-app", ".env.example"),
      "OPENAI_API_KEY=\nSHOP_AI_ENABLED=false\n"
    );
    git(["add", "shop-app"]);
    const clean = spawnSync(process.execPath, [checker, "--staged"], {
      cwd: folder,
      encoding: "utf8",
    });
    assert.equal(clean.status, 0, clean.stderr);
    assert.equal(JSON.parse(clean.stdout).filesChecked, 2);
    const privateValue = "req_" + "x".repeat(32);
    writeFileSync(
      join(folder, "shop-app", "README.md"),
      `Do not publish ${privateValue}`
    );
    mkdirSync(join(folder, "shop-app", ".local"));
    writeFileSync(
      join(folder, "shop-app", ".local", "fixture.sqlite"),
      "synthetic forbidden artifact"
    );
    git(["add", "shop-app"]);
    const blocked = spawnSync(process.execPath, [checker, "--staged"], {
      cwd: folder,
      encoding: "utf8",
    });
    assert.equal(blocked.status, 1);
    assert.equal(JSON.parse(blocked.stdout).violations.length, 2);
    assert.equal(blocked.stdout.includes(privateValue), false);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("public export base scan checks committed bytes even when the working copy disagrees", () => {
  const folder = mkdtempSync(join(tmpdir(), "shop-public-commit-"));
  const checker = fileURLToPath(
    new URL("../scripts/verify-public.mjs", import.meta.url)
  );
  const git = (args) =>
    execFileSync("git", args, { cwd: folder, stdio: "pipe", encoding: "utf8" });
  const commit = () => {
    git(["add", "README.md"]);
    git([
      "-c",
      "user.name=Synthetic Test",
      "-c",
      "user.email=synthetic@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--quiet",
      "-m",
      "Synthetic scanner fixture",
    ]);
  };
  try {
    git(["init", "--quiet"]);
    writeFileSync(join(folder, "README.md"), "Synthetic baseline");
    commit();
    const base = git(["rev-parse", "HEAD"]).trim();
    const privateValue = "req_" + "y".repeat(32);
    writeFileSync(join(folder, "README.md"), privateValue);
    commit();
    writeFileSync(join(folder, "README.md"), "Safe but unstaged working copy");
    const blocked = spawnSync(process.execPath, [checker, `--base=${base}`], {
      cwd: folder,
      encoding: "utf8",
    });
    assert.equal(blocked.status, 1);
    assert.equal(
      JSON.parse(blocked.stdout).violations[0].reason,
      "provider or project identifier"
    );
    assert.equal(blocked.stdout.includes(privateValue), false);
    commit();
    writeFileSync(join(folder, "README.md"), privateValue);
    const clean = spawnSync(process.execPath, [checker, `--base=${base}`], {
      cwd: folder,
      encoding: "utf8",
    });
    assert.equal(clean.status, 0, clean.stderr);
    assert.deepEqual(JSON.parse(clean.stdout).violations, []);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
