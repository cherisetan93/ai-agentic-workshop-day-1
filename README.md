# Snip Monorepo Aggregator

Snip is a tiny URL shortener organized as one backend and two clients:

- `backend/` exposes the HTTP API and redirect handler.
- `frontend/` is an Angular app for creating and browsing links.
- `cli/` is a zero-dependency Node command-line client for the same backend.

Each layer lives on its own branch in this same repository. This `main` branch is only the superproject that mounts those branch snapshots as submodules.

## API contract

| Method | Path | Request | Success | Error |
| --- | --- | --- | --- | --- |
| `POST` | `/api/links` | JSON `{ "url": "https://example.com" }` | `200`/`201` JSON `{ code, url, shortUrl, hits, createdAt }` | `400` JSON `{ error }` |
| `GET` | `/api/links` | none | `200` JSON array of link objects | JSON `{ error }` when applicable |
| `GET` | `/:code` | none | Redirects to the original URL via `Location` | `404` for unknown codes |

## Layout

```text
.
├── backend/   # submodule tracking the backend branch
├── frontend/  # submodule tracking the frontend branch
└── cli/       # submodule tracking the cli branch
```

The submodule configuration pins each folder to a commit while also recording which branch it tracks for updates.

## Clone

Use a recursive clone so the submodule working trees are populated immediately:

```sh
git clone --recurse-submodules https://github.com/cherisetan93/ai-agentic-workshop-day-1
cd ai-agentic-workshop-day-1
```

A plain `git clone` checks out this superproject but leaves `backend/`, `frontend/`, and `cli/` empty until you run:

```sh
git submodule update --init --recursive
```

## Run

Start the backend first:

```sh
cd backend
bun run server.js
```

In a second terminal, run the Angular client:

```sh
cd frontend
npm install
npm start
```

In a third terminal, run the CLI:

```sh
cd cli
node cli.js help
node cli.js add https://example.com
node cli.js ls
node cli.js open <code>
```

Both clients default to `http://localhost:3000`. The CLI can target another backend with `SNIP_API`:

```sh
SNIP_API=http://localhost:3000 node cli.js ls
```

## Updating a layer

Submodule changes are committed inside the layer first, then the superproject records the new pointer.

```sh
cd frontend
# make changes
git add .
git commit -m "Update frontend"
git push

cd ..
git submodule update --remote frontend
git add frontend
git commit -m "Bump frontend submodule"
git push
```

Use the same pattern for `backend/` or `cli/`: commit and push inside the submodule folder, then run `git submodule update --remote <path>`, `git add <path>`, and commit the pointer bump in the superproject.
