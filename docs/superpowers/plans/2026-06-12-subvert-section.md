# SUBVERT Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a desktop-first SUBVERT viewer at `/subvert` with a gallery entry button, fed by `source-subvert.csv` + `groups.yaml` via a new build script.

**Architecture:** `scripts/build-subvert.ts` expands multi-link CSV rows into `src/lib/subvert.json`, joining team metadata from YAML. `/subvert` is a single prerendered Svelte page with client-side ring-buffer pagination (3 columns), random section colors, and per-column iframes. Reuse `normalizeUrl` from `build-projects.ts`.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, `slugify`, `yaml`, `vitest`, `tsx`

**Spec:** `docs/superpowers/specs/2026-06-12-subvert-section-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `source-subvert.csv` | Poster source data (already exists) |
| `groups.yaml` | Team slugs, names, members (already exists) |
| `scripts/build-subvert.ts` | CSV + YAML → `subvert.json` |
| `scripts/build-subvert.test.ts` | Unit tests for parser, slugs, join |
| `src/lib/subvert.json` | Generated poster list (commit after generate) |
| `src/lib/subvert.ts` | Types, load JSON, `ringSlice`, `randomSectionColors` |
| `src/lib/components/EmbedFrame.svelte` | Shared iframe + spinner + timeout |
| `src/lib/components/SubvertPoster.svelte` | One column: EmbedFrame + text stack |
| `src/routes/subvert/+page.svelte` | 3-column viewer, prev/next, mobile banner |
| `src/routes/+page.svelte` | Add SUBVERT button top-right |
| `package.json` | `yaml` dep, extend `prebuild` / `generate` |

---

### Task 1: Dependencies and npm scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install YAML parser**

```bash
npm install -D yaml
```

- [ ] **Step 2: Update scripts in `package.json`**

```json
"prebuild": "tsx scripts/build-projects.ts && tsx scripts/build-subvert.ts",
"generate": "npm run prebuild"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "add yaml dep and subvert prebuild script"
```

---

### Task 2: Build script — tests first

**Files:**
- Create: `scripts/build-subvert.test.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/build-subvert.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
	parseSubvertCsv,
	makeSubvertSlug,
	expandRows,
	loadGroups,
	type SubvertCsvRow
} from './build-subvert';
import { normalizeUrl } from './build-projects';

const SAMPLE_CSV = `group,title,description,link-1,link-2,link-3,link-4
studio-rombo,Balloon-boy,,https://francescabrillanti-max.github.io/bimbi/,https://remo1112.github.io/balloon/,,
studio-zigzag,Il_Business_del_dolore,,https://christianfoglia.github.io/Poster_Ilbusinessdeldolore_ZigZag/,,,
studio-angolo,,,,,,`;

const SAMPLE_YAML = `
groups:
  - slug: studio-rombo
    name: Studio Rombo
    users:
      - Remo Spadone
  - slug: studio-zigzag
    name: Studio Zigzag
    users:
      - Christian Foglia
  - slug: studio-angolo
    name: Studio Angolo
    users: []
`;

describe('parseSubvertCsv', () => {
	it('parses fixed columns and collects link-N columns in order', () => {
		const rows = parseSubvertCsv(SAMPLE_CSV);
		expect(rows).toHaveLength(3);
		expect(rows[0]).toEqual({
			groupSlug: 'studio-rombo',
			title: 'Balloon-boy',
			description: '',
			links: [
				'https://francescabrillanti-max.github.io/bimbi/',
				'https://remo1112.github.io/balloon/'
			]
		});
	});

	it('skips empty link values', () => {
		expect(rows[1].links).toHaveLength(1);
	});
});

describe('makeSubvertSlug', () => {
	it('slugifies title for first link', () => {
		expect(makeSubvertSlug('Balloon-boy', 'studio-rombo', 2, 0)).toBe('balloon-boy');
	});

	it('suffixes additional links on same row', () => {
		expect(makeSubvertSlug('Balloon-boy', 'studio-rombo', 2, 1)).toBe('balloon-boy-2');
	});

	it('uses group and row index when title empty', () => {
		expect(makeSubvertSlug('', 'studio-angolo', 4, 0)).toBe('studio-angolo-4');
	});
});

describe('loadGroups', () => {
	it('indexes groups by slug', () => {
		const map = loadGroups(SAMPLE_YAML);
		expect(map.get('studio-rombo')?.name).toBe('Studio Rombo');
		expect(map.get('studio-rombo')?.users).toEqual(['Remo Spadone']);
	});
});

describe('expandRows', () => {
	it('expands links into separate poster entries with team join', () => {
		const rows = parseSubvertCsv(SAMPLE_CSV);
		const groups = loadGroups(SAMPLE_YAML);
		const posters = expandRows(rows, groups, normalizeUrl);
		expect(posters).toHaveLength(3);
		expect(posters[0]).toMatchObject({
			slug: 'balloon-boy',
			title: 'Balloon-boy',
			url: 'https://francescabrillanti-max.github.io/bimbi/',
			groupSlug: 'studio-rombo',
			teamName: 'Studio Rombo',
			members: ['Remo Spadone']
		});
		expect(posters[1].slug).toBe('balloon-boy-2');
	});

	it('skips rows with no valid links', () => {
		const rows = parseSubvertCsv(SAMPLE_CSV);
		const groups = loadGroups(SAMPLE_YAML);
		const posters = expandRows(rows, groups, normalizeUrl);
		expect(posters.find((p) => p.groupSlug === 'studio-angolo')).toBeUndefined();
	});

	it('throws on unknown group slug', () => {
		const rows: SubvertCsvRow[] = [
			{ groupSlug: 'unknown', title: 'X', description: '', links: ['https://example.com'] }
		];
		const groups = loadGroups(SAMPLE_YAML);
		expect(() => expandRows(rows, groups, normalizeUrl)).toThrow(/unknown group/i);
	});

	it('throws on duplicate slug', () => {
		const rows: SubvertCsvRow[] = [
			{ groupSlug: 'studio-rombo', title: 'Same', description: '', links: ['https://a.com'] },
			{ groupSlug: 'studio-zigzag', title: 'Same', description: '', links: ['https://b.com'] }
		];
		const groups = loadGroups(SAMPLE_YAML);
		expect(() => expandRows(rows, groups, normalizeUrl)).toThrow(/duplicate slug/i);
	});
});
```

Fix the test file: `rows` in second `parseSubvertCsv` test should call `parseSubvertCsv` locally:

```typescript
it('skips empty link values', () => {
	const rows = parseSubvertCsv(SAMPLE_CSV);
	expect(rows[1].links).toHaveLength(1);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test
```

Expected: FAIL — `build-subvert` module not found.

- [ ] **Step 3: Commit**

```bash
git add scripts/build-subvert.test.ts
git commit -m "add failing tests for build-subvert"
```

---

### Task 3: Build script — implementation

**Files:**
- Create: `scripts/build-subvert.ts`

- [ ] **Step 1: Implement `scripts/build-subvert.ts`**

```typescript
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import slugify from 'slugify';
import { normalizeUrl } from './build-projects';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(ROOT, 'source-subvert.csv');
const YAML_PATH = join(ROOT, 'groups.yaml');
const OUT_PATH = join(ROOT, 'src/lib/subvert.json');

export type SubvertPoster = {
	slug: string;
	title: string;
	description: string;
	url: string;
	groupSlug: string;
	teamName: string;
	members: string[];
};

export type SubvertCsvRow = {
	groupSlug: string;
	title: string;
	description: string;
	links: string[];
};

export type Group = {
	slug: string;
	name: string;
	users: string[];
};

export function parseSubvertCsv(text: string): SubvertCsvRow[] {
	const lines = text.trim().split(/\r?\n/);
	if (lines.length < 2) return [];

	const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
	const groupIdx = header.indexOf('group');
	const titleIdx = header.indexOf('title');
	const descIdx = header.indexOf('description');
	const linkIndices = header
		.map((h, i) => ({ h, i }))
		.filter(({ h }) => /^link(-\d+)?$/.test(h))
		.map(({ i }) => i);

	const rows: SubvertCsvRow[] = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		const parts = line.split(',');
		const links = linkIndices
			.map((idx) => (parts[idx] ?? '').trim())
			.filter(Boolean);
		rows.push({
			groupSlug: (parts[groupIdx] ?? '').trim(),
			title: (parts[titleIdx] ?? '').trim(),
			description: (parts[descIdx] ?? '').trim(),
			links
		});
	}
	return rows;
}

export function makeSubvertSlug(
	title: string,
	groupSlug: string,
	csvRowIndex: number,
	linkIndex: number
): string {
	const base =
		title.trim() !== ''
			? slugify(title, { lower: true, strict: true })
			: `${slugify(groupSlug, { lower: true, strict: true })}-${csvRowIndex}`;
	return linkIndex === 0 ? base : `${base}-${linkIndex + 1}`;
}

export function loadGroups(yamlText: string): Map<string, Group> {
	const doc = YAML.parse(yamlText) as { groups?: Group[] };
	const map = new Map<string, Group>();
	for (const g of doc.groups ?? []) {
		map.set(g.slug, { slug: g.slug, name: g.name, users: g.users ?? [] });
	}
	return map;
}

export function expandRows(
	rows: SubvertCsvRow[],
	groups: Map<string, Group>,
	normalize: (raw: string) => string | null
): SubvertPoster[] {
	const posters: SubvertPoster[] = [];
	const seen = new Set<string>();

	rows.forEach((row, i) => {
		const csvRowIndex = i + 2;
		if (row.links.length === 0) {
			console.warn(`[build-subvert] row ${csvRowIndex}: no valid links, skipping`);
			return;
		}

		const group = groups.get(row.groupSlug);
		if (!group) {
			throw new Error(`Unknown group slug "${row.groupSlug}" at CSV row ${csvRowIndex}`);
		}

		row.links.forEach((rawUrl, linkIndex) => {
			const url = normalize(rawUrl);
			if (!url) {
				console.warn(`[build-subvert] row ${csvRowIndex} link ${linkIndex + 1}: invalid URL, skipping`);
				return;
			}

			const slug = makeSubvertSlug(row.title, row.groupSlug, csvRowIndex, linkIndex);
			if (seen.has(slug)) {
				throw new Error(`Duplicate slug "${slug}" at CSV row ${csvRowIndex}`);
			}
			seen.add(slug);

			posters.push({
				slug,
				title: row.title,
				description: row.description,
				url,
				groupSlug: row.groupSlug,
				teamName: group.name,
				members: group.users
			});
		});
	});

	return posters;
}

function build(): SubvertPoster[] {
	const csv = readFileSync(CSV_PATH, 'utf8');
	const yaml = readFileSync(YAML_PATH, 'utf8');
	return expandRows(parseSubvertCsv(csv), loadGroups(yaml), normalizeUrl);
}

function main() {
	mkdirSync(dirname(OUT_PATH), { recursive: true });
	const posters = build();
	writeFileSync(OUT_PATH, JSON.stringify(posters, null, 2) + '\n');
	console.log(`[build-subvert] wrote ${posters.length} posters → ${OUT_PATH}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) main();
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Generate JSON**

```bash
npm run generate
```

Expected: `[build-subvert] wrote 5 posters → src/lib/subvert.json` (4 from links + verify count matches: balloon-boy, balloon-boy-2, il-business-del-dolore, il-respiro-del-circo, siamo-alla-frutta = 5 posters)

- [ ] **Step 4: Commit**

```bash
git add scripts/build-subvert.ts scripts/build-subvert.test.ts src/lib/subvert.json
git commit -m "add build-subvert pipeline and generated json"
```

---

### Task 4: Client helpers

**Files:**
- Create: `src/lib/subvert.ts`

- [ ] **Step 1: Create `src/lib/subvert.ts`**

```typescript
import subvertData from './subvert.json';
import type { SubvertPoster } from '../../scripts/build-subvert';

export type { SubvertPoster };
export const posters: SubvertPoster[] = subvertData;

const PAGE_SIZE = 3;

export function ringSlice<T>(items: T[], pageIndex: number, pageSize = PAGE_SIZE): T[] {
	const n = items.length;
	if (n === 0) return [];
	return Array.from({ length: pageSize }, (_, i) => items[(pageIndex * pageSize + i) % n]);
}

export function randomSectionColors(count = PAGE_SIZE): string[] {
	const colors: string[] = [];
	while (colors.length < count) {
		const h = Math.floor(Math.random() * 360);
		const s = 55 + Math.floor(Math.random() * 25);
		const l = 72 + Math.floor(Math.random() * 18);
		const color = `hsl(${h} ${s}% ${l}%)`;
		if (!colors.includes(color)) colors.push(color);
	}
	return colors;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/subvert.ts
git commit -m "add subvert client helpers"
```

---

### Task 5: Shared EmbedFrame component

**Files:**
- Create: `src/lib/components/EmbedFrame.svelte`

- [ ] **Step 1: Create `src/lib/components/EmbedFrame.svelte`**

Extract embed logic from `src/routes/p/[slug]/+page.svelte` into a reusable component:

```svelte
<script lang="ts">
	let {
		title,
		url,
		class: className = ''
	}: {
		title: string;
		url: string;
		class?: string;
	} = $props();

	let loading = $state(true);
	let embedFailed = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		url;
		loading = true;
		embedFailed = false;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			if (loading) embedFailed = true;
		}, 5000);
		return () => clearTimeout(timeoutId);
	});

	function onLoad() {
		loading = false;
		embedFailed = false;
		clearTimeout(timeoutId);
	}

	function openOriginal() {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

<div class="frame-wrap {className}">
	{#if loading}
		<div class="overlay">Loading…</div>
	{/if}
	{#if embedFailed}
		<div class="overlay error">
			<p>Can't embed this project.</p>
			<button class="btn" type="button" onclick={openOriginal}>Open original</button>
		</div>
	{/if}
	<iframe {title} src={url} onload={onLoad} class:hidden={embedFailed}></iframe>
</div>

<style>
	.frame-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #111;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
	}

	iframe.hidden {
		visibility: hidden;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		background: rgb(0 0 0 / 0.85);
		color: #fff;
		font-weight: 700;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.overlay.error p {
		margin: 0;
		text-align: center;
	}

	.btn {
		background: transparent;
		color: inherit;
		border: 2px solid currentColor;
		padding: 0.35rem 0.75rem;
		font: inherit;
		cursor: pointer;
	}
</style>
```

- [ ] **Step 2: Refactor `src/routes/p/[slug]/+page.svelte` to use EmbedFrame**

Replace the inline `frame-wrap` / iframe / overlay block with:

```svelte
import EmbedFrame from '$lib/components/EmbedFrame.svelte';
```

```svelte
<EmbedFrame title={project.title} url={project.url} class="full-bleed" />
```

Add style for full-bleed variant:

```css
:global(.full-bleed.frame-wrap) {
	flex: 1;
	min-height: 0;
	aspect-ratio: unset;
	height: 100%;
}
```

Remove now-unused `loading`, `embedFailed`, `timeoutId`, `onLoad` state from the page script. Keep `openOriginal` on the topbar button.

- [ ] **Step 3: Run check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/EmbedFrame.svelte src/routes/p/[slug]/+page.svelte
git commit -m "extract shared EmbedFrame component"
```

---

### Task 6: SubvertPoster column component

**Files:**
- Create: `src/lib/components/SubvertPoster.svelte`

- [ ] **Step 1: Create `src/lib/components/SubvertPoster.svelte`**

```svelte
<script lang="ts">
	import EmbedFrame from '$lib/components/EmbedFrame.svelte';
	import type { SubvertPoster } from '$lib/subvert';

	let {
		poster,
		background
	}: {
		poster: SubvertPoster;
		background: string;
	} = $props();

	const displayTitle = $derived(poster.title.trim() || 'Untitled');
	const membersLine = $derived(poster.members.join(' · '));
</script>

<section class="column" style:background>
	<EmbedFrame title={displayTitle} url={poster.url} />
	<div class="meta">
		<h1>{displayTitle}</h1>
		<h3>{poster.teamName}</h3>
		{#if poster.description.trim()}
			<p>{poster.description}</p>
		{/if}
		{#if membersLine}
			<small>{membersLine}</small>
		{/if}
	</div>
</section>

<style>
	.column {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 1rem;
		color: #111;
	}

	.meta {
		margin-top: 0.75rem;
	}

	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.25rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.95rem;
		font-weight: 700;
	}

	p {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		line-height: 1.45;
	}

	small {
		display: block;
		font-size: 0.75rem;
		opacity: 0.85;
		line-height: 1.4;
	}
</style>
```

- [ ] **Step 2: Validate with Svelte MCP `svelte-autofixer`**

Run autofixer on `SubvertPoster.svelte` until clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/SubvertPoster.svelte
git commit -m "add SubvertPoster column component"
```

---

### Task 7: SUBVERT viewer page

**Files:**
- Create: `src/routes/subvert/+page.svelte`

- [ ] **Step 1: Create `src/routes/subvert/+page.svelte`**

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import SubvertPoster from '$lib/components/SubvertPoster.svelte';
	import { posters, ringSlice, randomSectionColors } from '$lib/subvert';

	let pageIndex = $state(0);
	let colors = $state(randomSectionColors());

	const visible = $derived(ringSlice(posters, pageIndex));

	function goPrev() {
		pageIndex -= 1;
		colors = randomSectionColors();
	}

	function goNext() {
		pageIndex += 1;
		colors = randomSectionColors();
	}
</script>

<main class="subvert">
	<header class="topbar">
		<a class="btn" href="{base}/">← Gallery</a>
		<p class="desktop-hint">best on desktop</p>
	</header>

	{#if posters.length === 0}
		<div class="empty">
			<p>No SUBVERT posters yet.</p>
			<a class="btn" href="{base}/">Back to gallery</a>
		</div>
	{:else}
		<div class="columns">
			{#each visible as poster, i (poster.slug + '-' + pageIndex + '-' + i)}
				<SubvertPoster {poster} background={colors[i]} />
			{/each}
		</div>

		<nav class="pager">
			<button class="btn" type="button" onclick={goPrev}>← Prev</button>
			<button class="btn" type="button" onclick={goNext}>Next →</button>
		</nav>
	{/if}
</main>

<style>
	.subvert {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 0 1rem 1.5rem;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: var(--border);
		margin-bottom: 1rem;
	}

	.desktop-hint {
		margin: 0;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--fg-muted);
	}

	.columns {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0;
		min-height: 0;
	}

	.pager {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1.25rem;
	}

	.empty {
		flex: 1;
		display: grid;
		place-content: center;
		gap: 1rem;
		text-align: center;
		font-weight: 700;
		text-transform: uppercase;
	}

	.btn {
		background: transparent;
		color: var(--fg);
		border: var(--border);
		padding: 0.35rem 0.75rem;
		font: inherit;
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		text-decoration: none;
	}

	.btn:hover {
		background: var(--fg);
		color: var(--bg);
	}
</style>
```

- [ ] **Step 2: Validate with Svelte MCP `svelte-autofixer`**

- [ ] **Step 3: Commit**

```bash
git add src/routes/subvert/+page.svelte
git commit -m "add subvert viewer page"
```

---

### Task 8: Gallery SUBVERT button

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add button and header layout**

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { projects } from '$lib/projects';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
</script>

<main class="gallery">
	<div class="top-row">
		<a class="subvert-btn" href="{base}/subvert">SUBVERT</a>
	</div>

	<header>
		<h1>warmup</h1>
		<p class="subtitle">Settimana di workshop · #ABAMC</p>
	</header>
	<!-- grid unchanged -->
</main>
```

Add styles:

```css
.gallery {
	position: relative;
	/* existing padding rules */
}

.top-row {
	display: flex;
	justify-content: flex-end;
	margin-bottom: -1rem;
}

.subvert-btn {
	display: inline-block;
	background: #000;
	color: #fff;
	border: 2px solid #000;
	padding: 0.6rem 1.25rem;
	font: inherit;
	font-weight: 900;
	font-size: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	text-decoration: none;
}

.subvert-btn:hover {
	background: #fff;
	color: #000;
}
```

- [ ] **Step 2: Validate with Svelte MCP `svelte-autofixer`**

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "add SUBVERT button to gallery"
```

---

### Task 9: Final verification

**Files:** none

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: PASS

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds; `/subvert` prerendered.

- [ ] **Step 3: Manual smoke**

```bash
npm run preview
```

Checklist:
- `/warmup-results/` — black SUBVERT button top-right
- `/warmup-results/subvert` — 3 columns, 5 posters paginate with wrap, colors change on prev/next
- iframe load + timeout fallback per column
- `studio-angolo` empty row produces no poster (only 5 total)
- Mobile-width viewport shows “best on desktop” banner; columns stay 3-across

- [ ] **Step 4: Commit any remaining generated files**

```bash
git status
# commit if subvert.json or lockfile changed
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `source-subvert.csv` + `groups.yaml` → JSON | Task 2–3 |
| Multi-link row expansion | Task 2–3 |
| Unknown group fails build | Task 2–3 |
| Ring buffer, always 3 columns | Task 4, 7 |
| Random colors on page change | Task 4, 7 |
| 16:9 iframe | Task 5–6 |
| Text hierarchy h1/h3/p/small | Task 6 |
| SUBVERT button on gallery | Task 8 |
| `/subvert` prerendered | Task 7 (static kit default) |
| Embed timeout + open original | Task 5 |
| Empty poster list state | Task 7 |
| `base` path for links | Task 7–8 |
| `npm test` + `npm run build` | Task 9 |
