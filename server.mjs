import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const host = "127.0.0.1";
const port = 4173;
const root = dirname(fileURLToPath(import.meta.url));

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  if (url.pathname === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (url.pathname !== "/" && url.pathname !== "/index.html") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const html = await readFile(join(root, "public", "index.html"));
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": "text/html; charset=utf-8",
  });
  response.end(html);
});

server.listen(port, host, () => {
  console.log(`Owner review prototype: http://${host}:${port}/?variant=A`);
  console.log("Variants: A Guided cockpit, B Evidence workbook, C Decision journey");
});
