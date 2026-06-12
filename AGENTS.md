# AGENTS.md — warmup-results

Guidance for AI coding agents working in this repository.

## What this project is

Public gallery site for **ABA Perugia workshop student projects** (#ABAMC warmup week). Visitors browse a static grid of project cards, then open any project full-screen in an embedded iframe. The shell does not host student code — it links to live GitHub Pages URLs.

**Live site:** `https://<org>.github.io/warmup-results/` (GitHub Pages, base path `/warmup-results`)

**Design reference:** `style-ref.jpg` (duotone poster aesthetic). Full spec: `docs/superpowers/specs/2026-06-11-warmup-gallery-design.md`

## Stack

| Layer | Choice |
|-------|--------|
| Framework | SvelteKit 2 + Svelte 5 |
| Language | TypeScript |
| Build | Vite 8 |
| Deploy | `@sveltejs/adapter-static` → GitHub Actions → GitHub Pages |
| Data | `source.csv` → build script → `src/lib/projects.json` |

## Commands

```bash
npm install          # first-time setup
npm run dev          # local dev server
npm run generate     # regenerate projects.json from source.csv
npm run build        # prebuild (generate) + static site build
npm run preview      # preview production build
npm test             # vitest (build script unit tests)
npm run check        # svelte-check + sync
```

Always run `npm test` and `npm run build` before claiming work is done.

## Architecture

```
source.csv
    → scripts/build-projects.ts (prebuild)
    → src/lib/projects.json (generated — commit after CSV changes)
    → SvelteKit static prerender
    → build/ → GitHub Pages
```

### Routes

| Path | File | Purpose |
|------|------|---------|
| `/` | `src/routes/+page.svelte` | Gallery grid |
| `/p/[slug]` | `src/routes/p/[slug]/+page.svelte` | Topbar + full-viewport iframe |

All routes are prerendered. Dynamic slugs are enumerated via `entries()` in `src/routes/p/[slug]/+page.ts` from `projects.json`.

### Key modules

- `scripts/build-projects.ts` — CSV parser, URL normalization, slug generation, thumbnail resolution. Exports `Project` type, `normalizeUrl`, `makeSlug` (tested).
- `src/lib/projects.ts` — loads `projects.json`, `getProject()`, `randomSlug()`
- `src/lib/components/ProjectCard.svelte` — gallery card with thumbnail or dumbbell placeholder

## Data workflow

### Adding or editing projects

1. Edit `source.csv` (columns: `partecipante`, `progetto`, `link`). A 4th column (`REGISTRAZIONE SCHERMO?`) is **metadata only** — the parser uses column 3 for URLs and must not append extra columns to links.
2. Run `npm run generate` (or `npm run build`).
3. Commit both `source.csv` and the regenerated `src/lib/projects.json`.

### Slug rules

- Derived from `student + title` via `slugify` (`lower: true`, `strict: true`).
- Empty title → `{student-slug}-{csvRowIndex}` (e.g. `ashlyn-mochi-13`).
- **Duplicate slugs fail the build** — differentiate by title or fix CSV rows.

### URL rules (build time)

- Missing scheme → prepend `https://`
- Empty/invalid URL → warn and **skip row**
- Prefer HTTPS in CSV to avoid mixed-content issues

### Thumbnails (optional)

Drop `static/thumbnails/<slug>.{png,gif,webp}` then rebuild. No CSV change needed. If missing, `thumbnail` is `null` and the UI shows `static/dumbbell.svg`.

## Svelte / frontend conventions

- **Svelte 5 runes:** `$props()`, `$state()`, `$derived()`, `$effect()` — not legacy `export let` / `$:`.
- **Base path:** Always use `base` from `$app/paths` for internal links and static asset URLs (`{base}/p/...`, `{base}/dumbbell.svg`). The app is served under `/warmup-results`, not at domain root.
- **Global styles:** CSS variables in `src/routes/+layout.svelte` (`--bg`, `--fg`, `--fg-muted`, `--border`). Match the duotone poster look when adding UI.
- **No backend:** No API routes, auth, or server-side runtime. Static only.
- **Iframe shell:** Do not style content inside student iframes. The viewer page handles loading spinner, 5s embed timeout, and “Open original” fallback.

When editing `.svelte` files, use the Svelte MCP server (`list-sections` → `get-documentation` → `svelte-autofixer`) to validate changes.

## Testing

Tests live in `scripts/build-projects.test.ts` (Vitest). Cover:

- `normalizeUrl` behavior
- `makeSlug` (diacritics, empty titles, same student / different titles)
- CSV parsing edge cases (e.g. 4th column not leaking into URLs)

Add tests when changing build-script logic. Manual smoke: gallery card count, each `/p/:slug` iframe, Random and Open buttons.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`: `npm ci` → `npm run build` → deploy `build/` to GitHub Pages.

`svelte.config.js` sets `kit.paths.base = '/warmup-results'` and `adapter-static` with `fallback: '404.html'`.

## Out of scope (do not implement without explicit request)

- Git subtrees / vendored copies of student repos
- Automated thumbnail screenshots
- Search, filters, tags, analytics
- Styling inside embedded student sites
- Changing the GitHub Pages base path without updating `svelte.config.js`, thumbnail paths in `build-projects.ts`, and deploy docs

## Common pitfalls

| Pitfall | Correct approach |
|---------|------------------|
| Editing `projects.json` by hand | Regenerate via `npm run generate` after CSV changes |
| Hardcoding `/warmup-results` in components | Use `base` from `$app/paths` |
| Breaking CSV parse on commas in titles | Current parser splits on `,` — keep titles comma-free or improve parser deliberately with tests |
| Forgetting to commit generated JSON | CI builds from CSV at build time, but dev and PR review expect committed `projects.json` |
| Live iframes in gallery | Gallery uses static thumbnails/placeholders only; iframe only on `/p/[slug]` |

## File map

```
source.csv                          # source of truth for projects
scripts/build-projects.ts           # CSV → JSON pipeline
scripts/build-projects.test.ts      # unit tests
src/lib/projects.json               # generated (do not hand-edit)
src/lib/projects.ts                 # app-facing project helpers
src/lib/components/ProjectCard.svelte
src/routes/+layout.svelte           # global CSS variables + font
src/routes/+page.svelte             # gallery
src/routes/p/[slug]/+page.svelte     # iframe viewer
src/routes/+error.svelte            # 404
static/dumbbell.svg                 # placeholder icon
static/thumbnails/                  # optional per-slug images
.github/workflows/deploy.yml
docs/superpowers/specs/             # design spec and plans
```

## Commit style

Follow existing history: short imperative subjects (`fix csv parser`, `add embed timeout`). Group related changes (CSV + regenerated JSON + script) in one commit when updating the project list.
