import { writeFileSync } from "node:fs";

const out = [];
try {
  const c = await fetch("http://localhost:3000/api/auth/csrf");
  const cj = await c.json();
  const cookie = c.headers.getSetCookie().map((s) => s.split(";")[0]).join("; ");
  const s = await fetch("http://localhost:3000/api/auth/signin/discord", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie },
    body: new URLSearchParams({ csrfToken: cj.csrfToken, json: "true" }),
    redirect: "manual",
  });
  const j = JSON.parse(await s.text());
  const u = new URL(j.url);
  out.push("authorize endpoint : " + u.host + u.pathname);
  out.push("scope              : " + u.searchParams.get("scope"));
  out.push("redirect_uri       : " + u.searchParams.get("redirect_uri"));
  out.push("response_type      : " + u.searchParams.get("response_type"));
  out.push("state present      : " + Boolean(u.searchParams.get("state")));
  out.push("client_secret leaked: " + u.toString().includes("secret"));
} catch (e) {
  out.push("ERROR: " + e.message);
}
const text = out.join("\n");
writeFileSync("oauth-check.txt", text);
console.log(text);
