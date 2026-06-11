# Warmup Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a SvelteKit static gallery at `/warmup-results` that reads `source.csv`, shows a branded project grid, and embeds student GitHub Pages projects full-screen via iframe.

**Architecture:** Build-time CSV → `projects.json` via `scripts/build-projects.ts` (slugs from `slugify` package). SvelteKit static adapter prerenders gallery and all `/p/[slug]` routes. Purple/gray shell UI; student content lives in iframes.

**Tech Stack:** SvelteKit 2, `@sveltejs/adapter-static`, TypeScript, `tsx`, `slugify`, `vitest`, GitHub Actions → Pages

**Spec:** `docs/superpowers/specs/2026-06-11-warmup-gallery-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `scripts/build-projects.ts` | CSV parse, URL normalize, slugify slugs, thumbnail resolve, write JSON |
| `scripts/build-projects.test.ts` | Unit tests for slug + URL logic |
| `src/lib/projects.ts` | `Project` type, import JSON, helpers (`getBySlug`, `randomSlug`) |
| `src/lib/projects.json` | Generated project list (committed so dev works without prebuild) |
| `src/routes/+layout.svelte` | CSS variables, global typography |
| `src/routes/+page.svelte` | Gallery grid |
| `src/routes/p/[slug]/+page.svelte` | Topbar + iframe |
| `src/routes/p/[slug]/+page.ts` | `entries()` for prerender |
| `src/routes/+error.svelte` | Branded 404 |
| `static/dumbbell.svg` | Placeholder icon |
| `static/thumbnails/.gitkeep` | Thumbnail drop folder |
| `svelte.config.js` | Static adapter, `base: '/warmup-results'` |
| `.github/workflows/deploy.yml` | CI build + Pages deploy |

---

### Task 1: Scaffold SvelteKit project

**Files:**
- Create: entire SvelteKit skeleton via CLI
- Modify: `svelte.config.js`, `package.json`, `.gitignore`

- [ ] **Step 1: Create SvelteKit app in repo root**

Run from repo root (keep existing `source.csv`, `docs/`, `style-ref.jpg`):

```bash
cd /Users/giovanniabbatepaolo/Documents/GitHub/aba-perugia/warmup-results
npx sv create . --template minimal --types ts --no-add-ons
```

If CLI refuses non-empty dir, create in temp and merge, or use:

```bash
npm create svelte@latest . -- --template skeleton --types ts --no-prettier --no-eslint --no-playwright --no-vitest
```

Accept defaults that install dependencies.

- [ ] **Step 2: Add static adapter and dev dependencies**

```bash
npm install -D @sveltejs/adapter-static tsx slugify vitest
```

(`slugify` is a runtime dep of the build script; install as devDependency.)

- [ ] **Step 3: Configure static adapter**

Replace `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: '/warmup-results'
		},
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
```

- [ ] **Step 4: Add npm scripts**

In `package.json` scripts:

```json
{
  "prebuild": "tsx scripts/build-projects.ts",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "generate": "tsx scripts/build-projects.ts"
}
```

- [ ] **Step 5: Add vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['scripts/**/*.test.ts']
	}
});
```

- [ ] **Step 6: Update `.gitignore`**

Ensure `node_modules/`, `.svelte-kit/`, `build/` are ignored. Do **not** ignore `src/lib/projects.json` (commit generated file for dev ergonomics).

- [ ] **Step 7: Verify scaffold**

```bash
npm run build
```

Expected: fails on missing `scripts/build-projects.ts` — that's OK for this step. `npm run dev` should start.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold SvelteKit with static adapter"
```

---

### Task 2: Build script with slugify

**Files:**
- Create: `scripts/build-projects.ts`
- Create: `scripts/build-projects.test.ts`
- Create: `src/lib/projects.ts`
- Create: `static/thumbnails/.gitkeep`

- [ ] **Step 1: Write failing tests**

Create `scripts/build-projects.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeSlug, normalizeUrl } from './build-projects';

describe('normalizeUrl', () => {
	it('prepends https when missing', () => {
		expect(normalizeUrl('example.github.io/foo/')).toBe('https://example.github.io/foo/');
	});

	it('returns null for empty', () => {
		expect(normalizeUrl('')).toBeNull();
		expect(normalizeUrl('   ')).toBeNull();
	});

	it('keeps valid https', () => {
		expect(normalizeUrl('https://foo.bar/baz')).toBe('https://foo.bar/baz');
	});
});

describe('makeSlug', () => {
	it('slugifies student and title', () => {
		expect(makeSlug('VERONICA MENICHELLI', 'cuore a cuore', 1)).toBe(
			'veronica-menichelli-cuore-a-cuore'
		);
	});

	it('strips diacritics via slugify', () => {
		expect(makeSlug('Ludovico Di Buò', 'Brutalism', 1)).toBe('ludovico-di-buo-brutalism');
	});

	it('uses row index when title empty', () => {
		expect(makeSlug('Ashlyn Mochi', '', 13)).toBe('ashlyn-mochi-13');
	});

	it('differentiates two projects by same student', () => {
		const a = makeSlug('Francesca Brillanti', 'Collage Facce', 1);
		const b = makeSlug('Francesca Brillanti', 'Pixel Art', 2);
		expect(a).not.toBe(b);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module `./build-projects` not found.

- [ ] **Step 3: Implement build script**

Create `scripts/build-projects.ts`:

```ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import slugify from 'slugify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(ROOT, 'source.csv');
const OUT_PATH = join(ROOT, 'src/lib/projects.json');
const THUMB_DIR = join(ROOT, 'static/thumbnails');
const BASE = '/warmup-results';

export type Project = {
	slug: string;
	student: string;
	title: string;
	url: string;
	thumbnail: string | null;
};

export function normalizeUrl(raw: string): string | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	return `https://${trimmed}`;
}

export function makeSlug(student: string, title: string, rowIndex: number): string {
	const trimmedTitle = title.trim();
	if (!trimmedTitle) {
		return `${slugify(student, { lower: true, strict: true })}-${rowIndex}`;
	}
	return slugify(`${student} ${trimmedTitle}`, { lower: true, strict: true });
}

function parseCsv(text: string): Array<{ student: string; title: string; url: string }> {
	const lines = text.trim().split(/\r?\n/);
	const rows: Array<{ student: string; title: string; url: string }> = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		const parts = line.split(',');
		if (parts.length < 3) continue;
		const student = parts[0].trim();
		const title = parts[1].trim();
		const url = parts.slice(2).join(',').trim();
		rows.push({ student, title, url });
	}
	return rows;
}

function resolveThumbnail(slug: string): string | null {
	const exts = ['png', 'gif', 'webp'];
	for (const ext of exts) {
		const file = join(THUMB_DIR, `${slug}.${ext}`);
		if (existsSync(file)) return `${BASE}/thumbnails/${slug}.${ext}`;
	}
	return null;
}

function build(): Project[] {
	const csv = readFileSync(CSV_PATH, 'utf8');
	const rows = parseCsv(csv);
	const projects: Project[] = [];
	const seen = new Set<string>();

	rows.forEach((row, i) => {
		const rowIndex = i + 2;
		const url = normalizeUrl(row.url);
		if (!url) {
			console.warn(`[build-projects] row ${rowIndex}: invalid URL, skipping`);
			return;
		}

		const slug = makeSlug(row.student, row.title, rowIndex);
		if (seen.has(slug)) {
			throw new Error(`Duplicate slug "${slug}" at CSV row ${rowIndex}`);
		}
		seen.add(slug);

		projects.push({
			slug,
			student: row.student,
			title: row.title.trim() || 'Untitled',
			url,
			thumbnail: resolveThumbnail(slug)
		});
	});

	return projects;
}

function main() {
	mkdirSync(dirname(OUT_PATH), { recursive: true });
	mkdirSync(THUMB_DIR, { recursive: true });
	const projects = build();
	writeFileSync(OUT_PATH, JSON.stringify(projects, null, 2) + '\n');
	console.log(`[build-projects] wrote ${projects.length} projects → ${OUT_PATH}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) main();
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all PASS.

- [ ] **Step 5: Generate projects.json**

```bash
npm run generate
```

Expected: `[build-projects] wrote 12 projects → ...`

- [ ] **Step 6: Create `src/lib/projects.ts`**

```ts
import projectsData from './projects.json';
import type { Project } from '../../scripts/build-projects';

export type { Project };
export const projects: Project[] = projectsData;

export function getProject(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}

export function randomSlug(current?: string): string {
	const pool =
		current && projects.length > 1
			? projects.filter((p) => p.slug !== current)
			: projects;
	return pool[Math.floor(Math.random() * pool.length)].slug;
}
```

- [ ] **Step 7: Commit**

```bash
git add scripts/ src/lib/ static/thumbnails/ vitest.config.ts
git commit -m "feat: add CSV build pipeline with slugify"
```

---

### Task 3: Global layout and design tokens

**Files:**
- Modify: `src/routes/+layout.svelte`
- Modify: `src/app.html`
- Create: `static/dumbbell.svg`

- [ ] **Step 1: Add dumbbell SVG**

Create `static/dumbbell.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 48" fill="none" stroke="currentColor" stroke-width="2">
  <ellipse cx="18" cy="24" rx="14" ry="16"/>
  <ellipse cx="18" cy="24" rx="8" ry="10"/>
  <rect x="30" y="21" width="60" height="6" rx="1"/>
  <ellipse cx="102" cy="24" rx="14" ry="16"/>
  <ellipse cx="102" cy="24" rx="8" ry="10"/>
</svg>
```

- [ ] **Step 2: Global layout styles**

Replace `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app">
	{@render children()}
</div>

<style>
	:global(:root) {
		--bg: #9400ff;
		--fg: #cccccc;
		--fg-muted: rgb(204 204 204 / 0.7);
		--border: 2px solid var(--fg);
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(html, body) {
		margin: 0;
		min-height: 100%;
		background: var(--bg);
		color: var(--fg);
		font-family: Inter, system-ui, sans-serif;
	}

	.app {
		min-height: 100dvh;
	}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte static/dumbbell.svg
git commit -m "feat: add global layout and design tokens"
```

---

### Task 4: Gallery page

**Files:**
- Create: `src/lib/components/ProjectCard.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: ProjectCard component**

Create `src/lib/components/ProjectCard.svelte`:

```svelte
<script lang="ts">
	import type { Project } from '$lib/projects';
	import { base } from '$app/paths';

	let { project }: { project: Project } = $props();

	let imgError = $state(false);
</script>

<a class="card" href="{base}/p/{project.slug}">
	<div class="media">
		{#if project.thumbnail && !imgError}
			<img
				src={project.thumbnail}
				alt="{project.title} preview"
				onerror={() => (imgError = true)}
			/>
		{:else}
			<img class="placeholder-icon" src="{base}/dumbbell.svg" alt="" />
		{/if}
	</div>
	<h2>{project.title}</h2>
	<p>{project.student}</p>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: var(--border);
		color: inherit;
		text-decoration: none;
		transition: background 0.15s, color 0.15s;
	}

	.card:hover {
		background: var(--fg);
		color: var(--bg);
	}

	.media {
		aspect-ratio: 16 / 10;
		display: grid;
		place-items: center;
		border: 1px solid var(--fg);
		overflow: hidden;
	}

	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-icon {
		width: 40%;
		object-fit: contain;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--fg-muted);
	}

	.card:hover p {
		color: inherit;
		opacity: 0.8;
	}
</style>
```

- [ ] **Step 2: Gallery page**

Replace `src/routes/+page.svelte`:

```svelte
<script lang="ts">
	import { projects } from '$lib/projects';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
</script>

<main class="gallery">
	<header>
		<h1>warmup</h1>
		<p class="subtitle">Settimana di workshop · #ABAMC</p>
	</header>

	<div class="grid">
		{#each projects as project (project.slug)}
			<ProjectCard {project} />
		{/each}
	</div>
</main>

<style>
	.gallery {
		padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	h1 {
		display: inline-block;
		margin: 0;
		padding: 0.25rem 0.75rem;
		border: var(--border);
		font-size: clamp(2rem, 6vw, 3.5rem);
		font-weight: 900;
		text-transform: lowercase;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 1rem 0 0;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.75rem;
		color: var(--fg-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
	}
</style>
```

- [ ] **Step 3: Manual check**

```bash
npm run dev
```

Open `http://localhost:5173/warmup-results/` — 12 cards, placeholders with dumbbell.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/ src/routes/+page.svelte
git commit -m "feat: add gallery grid with project cards"
```

---

### Task 5: Full view with iframe and topbar

**Files:**
- Create: `src/routes/p/[slug]/+page.ts`
- Create: `src/routes/p/[slug]/+page.svelte`

- [ ] **Step 1: Full view page + route load**

Create `src/routes/p/[slug]/+page.svelte`:

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { getProject, randomSlug } from '$lib/projects';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const project = $derived(getProject(data.slug));

	let loading = $state(true);
	let embedFailed = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		data.slug;
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

	function goRandom() {
		const next = randomSlug(data.slug);
		goto(`${base}/p/${next}`);
	}

	function openOriginal() {
		if (project) window.open(project.url, '_blank', 'noopener,noreferrer');
	}
</script>

{#if !project}
	<p>Project not found. <a href="{base}/">Back to gallery</a></p>
{:else}
	<div class="viewer">
		<header class="topbar">
			<a class="btn" href="{base}/">← Gallery</a>
			<div class="meta">
				<strong>{project.title}</strong>
				<span>· {project.student}</span>
			</div>
			<div class="actions">
				<button class="btn" type="button" onclick={goRandom}>Random</button>
				<button class="btn" type="button" onclick={openOriginal}>Open ↗</button>
			</div>
		</header>

		<div class="frame-wrap">
			{#if loading}
				<div class="overlay">Loading…</div>
			{/if}
			{#if embedFailed}
				<div class="overlay error">
					<p>Can't embed this project.</p>
					<button class="btn" type="button" onclick={openOriginal}>Open original</button>
				</div>
			{/if}
			<iframe
				title={project.title}
				src={project.url}
				onload={onLoad}
				class:hidden={embedFailed}
			></iframe>
		</div>
	</div>
{/if}

<style>
	.viewer {
		display: flex;
		flex-direction: column;
		height: 100dvh;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-bottom: var(--border);
		flex-wrap: wrap;
	}

	.meta {
		flex: 1;
		min-width: 12rem;
		font-size: 0.9rem;
	}

	.meta strong {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
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

	.frame-wrap {
		position: relative;
		flex: 1;
		min-height: 0;
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
		gap: 1rem;
		background: var(--bg);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.overlay.error p {
		margin: 0;
		text-align: center;
	}
</style>
```

Create `src/routes/p/[slug]/+page.ts`:


```ts
import { projects } from '$lib/projects';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return projects.map((p) => ({ slug: p.slug }));
};

export const load: PageLoad = ({ params }) => {
	return { slug: params.slug };
};
```

- [ ] **Step 2: Manual check**

```bash
npm run dev
```

Visit a project URL, test Random and Open.

- [ ] **Step 3: Commit**

```bash
git add src/routes/p/
git commit -m "feat: add full-view iframe page with topbar"
```

---

### Task 6: Error page and production build

**Files:**
- Create: `src/routes/+error.svelte`

- [ ] **Step 1: Branded error page**

Create `src/routes/+error.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
</script>

<main class="error">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message ?? 'Page not found'}</p>
	<a class="btn" href="{base}/">← Gallery</a>
</main>

<style>
	.error {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		text-align: center;
		gap: 1rem;
		padding: 2rem;
	}

	h1 {
		margin: 0;
		font-size: 4rem;
		font-weight: 900;
	}

	.btn {
		justify-self: center;
		background: transparent;
		color: var(--fg);
		border: var(--border);
		padding: 0.5rem 1rem;
		font-weight: 700;
		text-transform: uppercase;
		text-decoration: none;
	}
</style>
```

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: static output in `build/`, 12 prerendered `/p/*` pages.

- [ ] **Step 3: Preview**

```bash
npm run preview
```

Smoke-test gallery + 2–3 project pages.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+error.svelte
git commit -m "feat: add branded error page"
```

---

### Task 7: GitHub Pages deploy

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages**

In repo Settings → Pages → Source: **GitHub Actions**.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
git push origin main
```

- [ ] **Step 4: Verify live site**

After workflow completes, open `https://<org>.github.io/warmup-results/` and spot-check gallery + iframe.

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| CSV → projects.json | Task 2 |
| slugify for slugs | Task 2 (`makeSlug` uses `slugify` package) |
| Thumbnail placeholders | Task 2 + Task 4 |
| Gallery grid | Task 4 |
| Full iframe + topbar | Task 5 |
| Random / Open / Gallery | Task 5 |
| Prerender all slugs | Task 5 |
| Purple/gray design | Task 3–4 |
| GitHub Pages + base path | Task 1 + Task 7 |
| Build tests | Task 2 |
| 404 handling | Task 6 |

No placeholders remain. Slug package name locked to `slugify` (not hand-rolled).
