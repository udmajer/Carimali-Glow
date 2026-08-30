import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number.parseInt(process.env.PORT || "4577", 10);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webp": "image/webp"
};

http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);
  let requested = path.resolve(root, `.${urlPath === "/" ? "/index.html" : urlPath}`);

  if (requested.startsWith(root) && fs.existsSync(requested) && fs.statSync(requested).isDirectory()) {
    requested = path.join(requested, "index.html");
  }

  if (!requested.startsWith(root) || !fs.existsSync(requested) || fs.statSync(requested).isDirectory()) {
    response.writeHead(404).end("Not found");
    return;
  }

  const stat = fs.statSync(requested);
  response.writeHead(200, {
    "Content-Type": types[path.extname(requested).toLowerCase()] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": "no-store",
    "Accept-Ranges": "bytes"
  });
  fs.createReadStream(requested).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Carimali Glow preview: http://localhost:${port}`);
});
