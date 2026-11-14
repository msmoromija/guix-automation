const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const sessionId = "openai-fast-reject";
const outDir = path.resolve(".dbg");
const logFile = path.join(outDir, `trae-debug-log-${sessionId}.ndjson`);
const envFile = path.join(outDir, `${sessionId}.env`);
const maxBody = 1024 * 1024;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(logFile, "");

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true }));
    return;
  }
  if (req.method !== "POST" || req.url !== "/event") {
    res.writeHead(404).end("not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > maxBody) req.destroy();
  });
  req.on("end", () => {
    try {
      const event = JSON.parse(body);
      if (event.sessionId !== sessionId) throw new Error("session mismatch");
      event.ts ||= Date.now();
      fs.appendFileSync(logFile, `${JSON.stringify(event)}\n`);
      res.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
    } catch {
      res.writeHead(400).end("invalid event");
    }
  });
});

let port = 7777;
let attempts = 0;
function listen() {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempts++ < 10) {
      port++;
      listen();
      return;
    }
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    const apiUrl = `http://127.0.0.1:${port}/event`;
    fs.writeFileSync(envFile, `DEBUG_SERVER_URL=${apiUrl}\nDEBUG_SESSION_ID=${sessionId}\n`);
    process.stdout.write(
      `@@DEBUG_SERVER_INFO\n${JSON.stringify({ api_url: apiUrl, session_id: sessionId, log_dir: outDir, log_file: logFile, env_file: envFile })}\n@@END_DEBUG_SERVER_INFO\n`,
    );
  });
}

listen();
