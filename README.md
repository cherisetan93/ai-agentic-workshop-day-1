# Snip backend

Snip is a tiny URL shortener powered by Bun. Links are stored in memory and
are cleared whenever the server restarts.

```bash
bun start
```

The API listens on port 3000 by default. Set `PORT`, `BASE_URL`, or
`PUBLIC_DIR` to configure it. It provides `POST /api/links`,
`GET /api/links`, and `GET /:code`.
