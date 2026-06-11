# Warmup Results Gallery — Design Spec

**Date:** 2026-06-11  
**Status:** Approved for implementation planning  
**Repo:** `warmup-results` → GitHub Pages at `/warmup-results`

## Goal

Public showcase site for student workshop projects. Visitors browse a lightweight gallery, open any project full-screen in an embedded iframe, and navigate via a topbar (gallery, random, open original). Optimized for desktop and mobile; each student project handles its own responsiveness.

## Decisions Summary

| Topic | Decision |
|-------|----------|
| Architecture | Gallery shell + iframe to live GitHub Pages URLs (Approach 1) |
| Embedding | Full-viewport iframe; no device-frame simulation |
| Gallery priority | Secondary — static thumbnails or placeholders |
| Thumbnails | Placeholders first; manual images in `static/thumbnails/` later |
| Hosting | GitHub Pages from this repo |
| Stack | SvelteKit + `@sveltejs/adapter-static` |
| Data source | `source.csv` (3 columns) → build script → `projects.json` |
| Subtrees | Not in v1; `projects/` reserved for optional archival later |
| Visual design | Duotone poster aesthetic from `style-ref.jpg` |

## Data Model

### CSV schema (`source.csv`)

| Column | Field | Notes |
|--------|-------|-------|
| `partecipante` | `student` | Display name |
| `progetto` | `title` | Empty → display "Untitled" |
| `link` | `url` | Must be valid HTTPS URL |

### Generated `projects.json` entry

```json
{
  "slug": "menichelli-cuore-a-cuore",
  "student": "VERONICA MENICHELLI",
  "title": "cuore a cuore",
  "url": "https://menichelliv05-beep.github.io/poster-uccelli/",
  "thumbnail": "/warmup-results/thumbnails/menichelli-cuore-a-cuore.png"
}
```

- `slug`: derived from `student` + `title`, URL-safe, lowercase, hyphenated
- `thumbnail`: public URL path if file exists at build time; otherwise `null`

### Slug rules

- Strip diacritics, lowercase, replace non-alphanumeric runs with `-`, trim `-`
- Duplicate slugs → **build fails** with clear error
- Empty title: slug uses student name + row index (e.g. `ashlyn-mochi-1`)

### URL normalization (build time)

- Prepend `https://` if missing
- Reject non-HTTP(S) values; log warning and **omit row** from output
- Prefer HTTPS to avoid mixed-content blocks on GitHub Pages

## App Structure & Routes

### Routes

| Route | View |
|-------|------|
| `/` | Gallery grid |
| `/p/[slug]` | Full view: topbar + iframe |

Client-side routing via SvelteKit file-based routes. All routes prerendered; dynamic slugs enumerated via `entries()` from `projects.json`.

### Gallery (`/`)

- Minimal chrome: warmup header, optional `SETTIMANA DI WORKSHOP · #ABAMC` subtitle
- Responsive grid of project cards (CSS grid, 1–4 columns by breakpoint)
- Card click → `/p/:slug`
- No live iframes in gallery

### Full view (`/p/[slug]`)

```
┌──────────────────────────────────────────────────────────┐
│ Topbar: [← Gallery]  Title · Student  [Random] [Open ↗] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              iframe (100vw × remaining height)           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- **Gallery**: navigate to `/`
- **Random**: uniform random slug from all projects (skip current when count > 1)
- **Open**: `window.open(project.url)` with `rel="noopener"`

### SvelteKit config

- `adapter-static`
- `kit.paths.base = '/warmup-results'`
- `prerender.entries`: all `/p/[slug]` from build output

## Build Pipeline

```
source.csv
    │
    ▼
scripts/build-projects.ts   (npm prebuild)
    │
    ├── parse CSV
    ├── normalize URLs
    ├── derive slugs (fail on duplicates)
    ├── resolve thumbnails in static/thumbnails/<slug>.{png,gif,webp}
    └── write src/lib/projects.json
            │
            ▼
vite build (SvelteKit static)
            │
            ▼
GitHub Actions → GitHub Pages
```

### npm scripts

```json
{
  "prebuild": "tsx scripts/build-projects.ts",
  "build": "vite build",
  "preview": "vite preview"
}
```

### Thumbnail workflow

1. v1 ships with placeholders only (`thumbnail: null`)
2. To add: drop `static/thumbnails/<slug>.png` (or `.gif`, `.webp`), rebuild, redeploy
3. No CSV edit required

## Error Handling

### Build time

| Condition | Behavior |
|-----------|----------|
| Invalid/missing URL | Warn; omit row |
| Duplicate slug | Fail build |
| Empty title | Slug with index; UI shows "Untitled" |

### Gallery

| Condition | Behavior |
|-----------|----------|
| `thumbnail: null` | Placeholder card: dumbbell icon + title + student |
| Broken image | `onerror` → same placeholder |

### Full view

| Condition | Behavior |
|-----------|----------|
| Unknown slug | 404 page with link to gallery |
| iframe loading | Spinner overlay until `load` event |
| iframe blocked / timeout (~5s) | Message + prominent Open original button |

No auth, backend, or analytics in v1.

## Visual Design

Reference: `style-ref.jpg` at repo root (workshop poster).

### Palette

| Token | Value | Use |
|-------|--------|-----|
| `--bg` | `#9400FF` | Page background |
| `--fg` | `#CCCCCC` | Text, borders, icons |
| `--fg-muted` | `rgb(204 204 204 / 0.7)` | Student name, subtitles |

### Typography

- Heavy geometric sans-serif (Inter Black or similar system fallback)
- Header/subtitle: uppercase, tight letter-spacing

### Components

| Component | Style |
|-----------|-------|
| Gallery cards | 2px `--fg` outline, transparent fill; hover: invert or thicker border |
| Placeholder | Centered `dumbbell.svg`, title, student |
| Thumbnail card | Image + outline; title below or overlaid |
| Topbar | Purple bar, outlined pill buttons |
| iframe | Full bleed; student content unstyled by shell |

### Static assets

| File | Purpose |
|------|---------|
| `static/dumbbell.svg` | Placeholder icon |
| `static/warmup-logo.svg` | Header wordmark (v1: styled text acceptable) |
| `static/thumbnails/*` | Optional per-project previews |

## File Layout

```
warmup-results/
├── source.csv
├── style-ref.jpg                 # design reference (not served as UI)
├── scripts/
│   └── build-projects.ts
├── static/
│   ├── dumbbell.svg
│   ├── warmup-logo.svg
│   └── thumbnails/               # optional PNG/GIF/WebP per slug
├── src/
│   ├── lib/
│   │   ├── projects.json         # generated
│   │   └── projects.ts           # types + load helper
│   ├── routes/
│   │   ├── +layout.svelte        # global styles, CSS variables
│   │   ├── +page.svelte          # gallery
│   │   ├── +error.svelte
│   │   └── p/[slug]/
│   │       └── +page.svelte
│   └── app.html
├── svelte.config.js
├── .github/workflows/deploy.yml
└── docs/superpowers/specs/
    └── 2026-06-11-warmup-gallery-design.md
```

## Testing

| Layer | Scope |
|-------|-------|
| Build script | Slug uniqueness, URL validation, row count matches valid CSV rows |
| Manual smoke | Gallery renders N cards; each `/p/:slug` loads iframe; Random + Open work |
| CI | `npm run build` must pass; optional unit test for build script |

No CI dependency on external student sites staying online.

## Deployment

- GitHub Action on push to `main`: install → prebuild → build → deploy `build/` to Pages
- Site URL: `https://<org>.github.io/warmup-results/`

## Out of Scope (v1)

- Git subtrees / vendored project copies
- Automated thumbnail capture
- Search, filters, tags
- User accounts or analytics
- Styling inside student iframes

## Future (v2)

- `projects/` git subtrees for dead links or frozen snapshots
- Headless screenshot script for thumbnails
- Per-project metadata (tags, year, course)
