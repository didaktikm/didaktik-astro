# didaktik.dev

Personal site: "Infrastructure for the era of autonomous agents" / Platform Engineering.
Russian only, static (Astro), served by Caddy in Docker. Dark node-grid background and an interactive terminal.

## Structure

```
.
├── src/
│   ├── layouts/Base.astro   # page markup and texts
│   ├── pages/index.astro
│   └── styles/global.css
├── public/
│   ├── site.js              # node grid + terminal (vanilla JS)
│   ├── favicon.svg
│   └── robots.txt
├── deploy/
│   ├── Caddyfile            # in-container static server
│   ├── compose.yaml         # joins external network `proxy`, no published ports
│   └── proxy-snippet.Caddyfile  # block for the shared Caddy proxy
├── Dockerfile               # node build -> caddy:2-alpine
└── .github/workflows/ci.yml
```

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```

## Deploy

```bash
docker network create proxy        # once, if the shared proxy stack has not created it
docker compose -f deploy/compose.yaml up -d --build
```

Add `deploy/proxy-snippet.Caddyfile` to the Caddyfile of the shared proxy and reload Caddy.

## TODO

- Replace placeholder contact `hello@didaktik.dev` in `src/layouts/Base.astro`.
- Commit `package-lock.json` after the first `npm install`, then switch Dockerfile and CI to `npm ci`.
- Terminal answers live in `public/site.js`; edit jokes there.
