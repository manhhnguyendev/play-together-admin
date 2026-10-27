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
npm run dev      # dev server on port 5174
npm run build    # typecheck (tsc -b) + production build
npm run lint     # oxlint
npm run preview  # serve the production build
```

## Notes

- Sign-in verifies the account through `GET /admin/stats`; a `403` means the account is not an admin,
  so the tokens are discarded and the console stays on the login page.
- API types are written by hand in `src/api/types.ts` — the API's OpenAPI document still ships empty
  response schemas, so code generation is not usable yet.
- The access token lives in `localStorage`; a `401` triggers a single-flight refresh against
  `/auth/refresh` and the failed request is retried once.
