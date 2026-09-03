const links = new Map();
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const publicDir = process.env.PUBLIC_DIR;
const baseUrl = (
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${port}`)
).replace(/\/+$/, "");

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function makeCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  } while (links.has(code));
  return code;
}

function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function servePublic(pathname) {
  if (!publicDir) return null;

  let relativePath;
  try {
    relativePath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (relativePath === "/") relativePath = "/index.html";
  const segments = relativePath.split("/");
  if (segments.some((segment) => segment === "..")) return null;

  const file = Bun.file(`${publicDir}/${relativePath.replace(/^\/+/, "")}`);
  if (await file.exists()) return new Response(file);
  return null;
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const { pathname } = requestUrl;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Request body must be valid JSON." }, 400);
      }

      if (!isHttpUrl(body?.url)) {
        return json({ error: "url must be a valid http(s) URL." }, 400);
      }

      const code = makeCode();
      const link = {
        code,
        url: body.url,
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    if (request.method === "GET" && pathname === "/api/links") {
      return json([...links.values()]);
    }

    if (request.method === "GET") {
      const publicResponse = await servePublic(pathname);
      if (publicResponse) return publicResponse;

      let code;
      try {
        code = decodeURIComponent(pathname.slice(1));
      } catch {
        return new Response("Not found", { status: 404 });
      }

      if (!code || code.includes("/")) return new Response("Not found", { status: 404 });
      const link = links.get(code);
      if (!link) return new Response("Not found", { status: 404 });

      link.hits += 1;
      return Response.redirect(link.url, 302);
    }

    return new Response("Method not allowed", { status: 405 });
  },
});

console.log(`Snip listening on http://localhost:${server.port}`);
