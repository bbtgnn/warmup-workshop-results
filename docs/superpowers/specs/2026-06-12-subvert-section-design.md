# SUBVERT Section — Design Spec

**Date:** 2026-06-12  
**Status:** Approved for implementation planning  
**Repo:** `warmup-results` → GitHub Pages at `/warmup-results`

## Goal

Add a **SUBVERT** section to the warmup gallery site: a desktop-first paginated viewer for workshop posters. Visitors reach it via a prominent button on the main gallery. Each page shows three posters side by side in columns, each embedded via iframe with team and metadata below. Posters are sourced from a new CSV joined to a teams YAML file at build time.

## Decisions Summary

| Topic | Decision |
|-------|----------|
| Architecture | Separate `build-subvert.ts` + `/subvert` route; same static pipeline as gallery |
| Data | `source-subvert.csv` + `groups.yaml` → `subvert.json` |
| Multiple links per CSV row | Each link becomes a separate ring-buffer entry (shared title, description, group) |
| Group field | CSV `group` column is a slug matching `groups.yaml` |
| Pagination | Client-side ring buffer; URL stays `/subvert` |
| Page size | Always 3 posters; last page wraps to list start to fill columns |
| Layout | **3 columns** (horizontal), desktop-first |
| Section colors | 3 distinct random backgrounds per page view; re-roll on prev/next |
| Mobile | SUBVERT reachable; banner “best on desktop”; layout not optimized (v2) |
| Stack | SvelteKit static, Svelte 5 runes, existing global CSS variables |

## Data Model

### `source-subvert.csv`

| Column | Field | Notes |
|--------|-------|-------|
| `group` | `groupSlug` | Slug matching an entry in `groups.yaml` |
| `title` | `title` | Poster title; empty → slug uses `{groupSlug}-{rowIndex}` |
| `description` | `description` | Body copy below team name (may be empty) |
| `link-1`, `link-2`, `link-3`, `link-4`, … | `url` | Variable link columns after description; each non-empty value produces one poster entry |

**Row expansion:** A row with N non-empty link columns yields N entries in `subvert.json`, sharing `groupSlug`, `title`, and `description`. Order: left-to-right link columns, preserving CSV row order across rows.

**Slug rules (per expanded entry):**

- First link on a row: `slugify(title)` if title non-empty; else `{groupSlug}-{csvRowIndex}`
- Additional links on same row: `{baseSlug}-2`, `-3`, …
- Duplicate slugs → **build fails** with row/column reference

**URL normalization:** Reuse `normalizeUrl` from `build-projects.ts` — prepend `https://` if missing; invalid/empty → warn and skip that link only.

### `groups.yaml`

```yaml
groups:
  - slug: studio-rombo
    name: Studio Rombo
    users:
      - Remo Spadone
      - Mourad Amadel
```

Each group is a **single YAML object** with `slug`, `name`, and `users` (string array). Unknown `group` slug in CSV → **build fails**.

### Generated `subvert.json` entry

```json
{
  "slug": "my-poster-2",
  "title": "My Poster",
  "description": "…",
  "url": "https://example.github.io/poster/",
  "groupSlug": "studio-rombo",
  "teamName": "Studio Rombo",
  "members": ["Remo Spadone", "Mourad Amadel"]
}
```

Flat array; order matches CSV expansion order. Commit regenerated JSON after CSV/YAML changes (same workflow as `projects.json`).

## App Structure & Routes

| Route | View |
|-------|------|
| `/` | Gallery grid + **SUBVERT** button (top-right) |
| `/subvert` | Three-column poster viewer + prev/next |

- Prerender `/subvert` as a single static page (no dynamic slug routes).
- Internal links use `base` from `$app/paths` (`{base}/subvert`, `{base}/`).

### Gallery change (`/`)

Add a large black **SUBVERT** button in the top-right corner of the main page:

- Black background, white uppercase text
- Links to `{base}/subvert`
- Header area becomes a flex row: existing centered title block unchanged; button absolutely positioned or in a top bar row

### SUBVERT viewer (`/subvert`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Gallery]                                      best on desktop │
├────────────────┬────────────────┬────────────────────────────────┤
│ ░░ bg color A ░│ ░░ bg color B ░│ ░░ bg color C ░░░░░░░░░░░░░░░░│
│ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐               │
│ │  iframe    │ │ │  iframe    │ │ │  iframe    │  16:9 each    │
│ │  16:9      │ │ │  16:9      │ │ │  16:9      │               │
│ └────────────┘ │ └────────────┘ │ └────────────┘               │
│ h1 Title       │ h1 Title       │ h1 Title                      │
│ h3 Team name   │ h3 Team name   │ h3 Team name                  │
│ p Description  │ p Description  │ p Description                 │
│ small members  │ small members  │ small members                 │
├────────────────┴────────────────┴────────────────────────────────┤
│                    [ ← Prev ]    [ Next → ]                      │
└──────────────────────────────────────────────────────────────────┘
```

**Text hierarchy per column (below iframe):**

1. `h1` — poster title
2. `h3` — team name (from YAML `name`)
3. `p` — description
4. `small` — member names (e.g. joined with ` · `)

**Column layout:**

- CSS grid or flex: `grid-template-columns: 1fr 1fr 1fr` on desktop
- Each column is a section with its own random background color
- Iframe container: `aspect-ratio: 16 / 9`; width 100% of column; text block matches column width

**Ring-buffer pagination:**

- `pageIndex` in client state (not in URL)
- Posters indexed `0 … n-1` from `subvert.json`
- Visible indices: `(pageIndex * 3 + i) % n` for `i ∈ {0, 1, 2}`
- Prev/Next increment/decrement `pageIndex` with wrap (ring buffer)
- On each page change: pick 3 new distinct random background colors

**Random colors:**

- Generated client-side on mount and on every prev/next
- All 3 colors on a page must differ
- Use a constrained palette (e.g. light/mid HSL values) so dark text remains readable on all columns without per-column contrast logic

**Mobile (v1):**

- Show a visible “best on desktop” banner on `/subvert`
- Do not hide the SUBVERT button on gallery
- No responsive column reflow; intentional deferral to a future mobile version

## Build Pipeline

```
source-subvert.csv ──┐
                     ├── scripts/build-subvert.ts (npm prebuild)
groups.yaml ─────────┘         │
                        ├── parse CSV, expand links
                        ├── load YAML, join by slug
                        ├── normalize URLs, derive slugs
                        └── write src/lib/subvert.json
                                    │
                                    ▼
                          vite build (existing)
```

### npm scripts

Extend existing `prebuild` to run both generators:

```json
{
  "prebuild": "tsx scripts/build-projects.ts && tsx scripts/build-subvert.ts",
  "generate": "npm run prebuild"
}
```

Share `normalizeUrl` (and optionally `slugify` config) between build scripts via a small shared module or import from `build-projects.ts`.

## Components & Files

```
source-subvert.csv
groups.yaml
scripts/
  build-subvert.ts
  build-subvert.test.ts
src/
  lib/
    subvert.json          # generated
    subvert.ts            # types + load helper + ring-buffer helper
    components/
      SubvertPoster.svelte   # single column: iframe + text stack
  routes/
    +page.svelte          # add SUBVERT button
    subvert/
      +page.svelte        # viewer: 3 columns, prev/next, colors
```

Optional: extract shared iframe embed logic (spinner, timeout, open link) from `/p/[slug]` into `src/lib/embed.ts` or `EmbedFrame.svelte` if duplication is significant.

## Error Handling

### Build time

| Condition | Behavior |
|-----------|----------|
| Invalid/empty URL for one link column | Warn; skip that link only |
| CSV row with no valid links (e.g. placeholder row) | Warn; skip row — produces zero entries |
| Unknown `group` slug | Fail build |
| Duplicate poster slug | Fail build |
| No valid posters after parse | Warn; emit empty array |

### Runtime (`/subvert`)

| Condition | Behavior |
|-----------|----------|
| Empty `subvert.json` | Empty state message + link to gallery |
| iframe loading | Spinner overlay until `load` |
| iframe blocked / ~5s timeout | Message + “Open original” per column |
| n = 1 or 2 posters | Still show 3 columns; ring buffer repeats entries |

## Testing

| Layer | Scope |
|-------|-------|
| `build-subvert.test.ts` | Link expansion, slug suffixes, group join, URL normalize, unknown group fails |
| Manual smoke | SUBVERT button on `/`; `/subvert` shows 3 columns; prev/next wrap; colors change; iframe + fallback |
| CI | `npm test` + `npm run build` must pass |

## Out of Scope (v1)

- Mobile-optimized SUBVERT layout
- URL-based pagination (`/subvert/2`)
- Search, filter, or group navigation
- Styling inside student iframes
- Automated poster screenshots

## Future (v2)

- Dedicated mobile layout for SUBVERT (stacked sections or swipe)
- Optional URL hash/page param for shareable pages
- Per-group landing or filter
