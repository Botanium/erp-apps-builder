import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = resolve(".netlify");
const violations = [];
const manifest = [];
let clientFiles = 0;
let containedSymlinks = 0;
const secretIdentifiers = /OPENAI_API_KEY|SHOP_OWNER_PASSWORD_HASH|SHOP_SESSION_SECRET|owner-config\.json/;
// Conservative value-shaped checks plus known synthetic qualification credentials, never printed.
const credentialValues = /(?<![A-Za-z0-9_-])sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s/:]+:[^\s@]+@|scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+[A-Za-z0-9+/=]{40,}|Synthetic-(?:adapter-)?only-owner-password|Synthetic-adapter-owner-password|synthetic-no-provider-credential/;
function visit(folder) {
  for (const entry of readdirSync(folder,{withFileTypes:true})) {
    const full = resolve(folder,entry.name);
    const name = relative(root,full);
    if (/(?:^|[/])(?:\.env(?:\.|$)|\.local(?:[/]|$)|\.eve(?:[/]|$)|\.output(?:[/]|$)|owner-config\.json$)|\.(?:sqlite3?|db)(?:-(?:wal|shm))?$/.test(name)) violations.push({path:name,kind:"private-path"});
    if (entry.isSymbolicLink()) {
      const target=realpathSync(full);
      if(!target.startsWith(root+sep)) violations.push({path:name,kind:"escaping-symlink"});
      else containedSymlinks++;
    } else if(entry.isDirectory()) visit(full);
    else {
      const bytes=readFileSync(full);
      const content=bytes.toString("utf8");
      manifest.push([name,createHash("sha256").update(bytes).digest("hex")]);
      if(credentialValues.test(content)) violations.push({path:name,kind:"credential-shaped-value"});
      if(/(?:^|[/])(?:_next|\.next)[/]static[/].*\.(?:js|json|map)$/.test(name)) {
        clientFiles++;
        if(secretIdentifiers.test(content)) violations.push({path:name,kind:"client-secret-identifier"});
      }
    }
  }
}
visit(root);
assert.ok(manifest.length>0 && clientFiles>0,"Adapter server and client artifacts must exist");
manifest.sort(([a],[b])=>a.localeCompare(b));
console.log(JSON.stringify({regularFiles:manifest.length,containedSymlinks,clientFiles,contentManifestSha256:createHash("sha256").update(JSON.stringify(manifest)).digest("hex"),violations,limits:"Pattern checks are defense-in-depth, not proof against all secret formats. Built from public checkout with allowlisted child environment; no real credential was supplied."},null,2));
if(violations.length) process.exitCode=1;
