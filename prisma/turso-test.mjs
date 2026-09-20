import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";
import { writeFileSync } from "node:fs";

function loadEnvFile(path = ".env") {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvFile();

const out = [];
const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
out.push("url set: " + Boolean(url));
out.push("token set: " + Boolean(authToken) + " (len " + (authToken?.length ?? 0) + ")");

try {
  const client = createClient({ url, authToken });
  const r = await client.execute("SELECT 1 AS ok");
  out.push("CONNECTED: " + JSON.stringify(r.rows));
  const t = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  out.push("tables (" + t.rows.length + "): " + t.rows.map((x) => x.name).join(", "));
} catch (e) {
  out.push("FAILED: " + e.message);
}

writeFileSync("turso-result.txt", out.join("\n"));
console.log(out.join("\n"));
