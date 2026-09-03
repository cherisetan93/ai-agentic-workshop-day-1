# Snip CLI

Zero-dependency Node CLI for the Snip backend. It uses global `fetch`, so run it with Node 18 or newer.

```sh
snip add https://example.com
snip ls
snip open abc123
```

Set `SNIP_API` to point at a different backend:

```sh
SNIP_API=http://localhost:3000 snip ls
```

Commands:

- `snip add <url>` posts to `/api/links` and prints the returned short URL.
- `snip ls` prints an aligned `CODE  HITS  URL` table, or `No links yet.` when empty.
- `snip open <code>` asks `/:code` for its redirect target and opens it in the OS browser.
- `snip help` prints usage.
