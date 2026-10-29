# Play Together Admin

Web console for the **Play Together** platform, built against the NestJS API v2.

Covers the moderation and operations surface: platform overview, users, withdrawals
(users and charities), charities, feedback, reports, flagged ratings, game catalog
(games, game types, ranks), runtime configuration, broadcasts and maintenance mode.

## Stack

React 19 · TypeScript · Vite · Ant Design 6 · TanStack Query 5 · Zustand 5 · axios · React Router 7

## Getting started

```bash
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:3000/api/v2
npm run dev            # http://localhost:5174
```

The API must be running (see `play-together-be`). Seeded admin account:
`admin@playtogether.local` / `Admin@12345`.

## Scripts

```bash
npm run dev           # dev server on port 5174
npm run build         # typecheck (tsc -b) + production build
npm run lint          # oxlint
npm run preview       # serve the production build
npm run api:generate  # regenerate src/api/generated from the API OpenAPI document
```

## API client generation

`src/api/generated` is produced by [Orval](https://orval.dev) from
`../play-together-be/openapi.json` (override with `OPENAPI_INPUT=...`). Refresh that
file with `npm run openapi:export` in `play-together-be` while the API is running, then
run `npm run api:generate`. Generated code is excluded from linting and is safe to delete
and regenerate.

## Docker

The image is a two-stage build (Vite build, then nginx) that serves the SPA and proxies
`/api/` to the `api` service, so the browser stays same-origin and no CORS setup is needed.

```bash
docker build -t play-together-admin --build-arg VITE_API_URL=/api/v2 .
docker run -p 8080:80 play-together-admin   # expects an `api` host on port 3000
```

`VITE_API_URL` is baked at build time because Vite inlines `VITE_*` variables; rebuild after
changing it. In practice the stack is started from the root repo's `docker-compose.yml`, which
wires this container to the API and PostgreSQL.

On Windows, Git Bash rewrites a leading-slash value into a Windows path, so a manual build needs
`MSYS_NO_PATHCONV=1 VITE_API_URL=/api/v2 docker build ...` (compose passes build args itself, so
`docker compose build admin` is unaffected).

## Notes

- Sign-in verifies the account through `GET /admin/stats`; a `403` means the account is not an admin,
  so the tokens are discarded and the console stays on the login page.
- The access token lives in `localStorage`; a `401` triggers a single-flight refresh against
  `/auth/refresh` and the failed request is retried once. `src/api/client.ts` only owns the axios
  instance, the token session and `ApiError` — no endpoint helpers live there.
- Every request goes through the generated Orval client, re-exported by the facades in
  `src/api/admin.ts` (`authService`, `adminService`, `catalogService`, `configService`) together with
  the generated models from `src/api/types.ts`.
- Lists use `usePagedQuery`, writes use `useApiMutation`; both take their cache keys from
  `src/api/keys.ts` (`adminKeys`, `catalogKeys`, `publicConfigKey`) so a mutation invalidates every
  affected list at once. `QueryError` renders `ApiError` messages consistently.
- Routes are split with React Router's route-level `lazy` in `src/app/router.tsx`: each page gets its
  own chunk (the largest page is ~36 kB) and the entry chunk is ~250 kB instead of the previous
  single 1.38 MB bundle. Ant Design still accounts for a ~590 kB shared vendor chunk on first load.

## License

MIT — see `LICENSE`. Student capstone project; verify third-party assets before commercial use.
