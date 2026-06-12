import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import slugify from 'slugify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(ROOT, 'source.csv');
const OUT_PATH = join(ROOT, 'src/lib/projects.json');
const THUMB_DIR = join(ROOT, 'static/thumbnails');
const GIF_DIR = join(ROOT, 'static/gifs');
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

function parseCsv(
	text: string
): Array<{ student: string; title: string; url: string; preview?: string }> {
	const lines = text.trim().split(/\r?\n/);
	const rows: Array<{ student: string; title: string; url: string; preview?: string }> = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		const parts = line.split(',');
		if (parts.length < 3) continue;
		const student = parts[0].trim();
		const title = parts[1].trim();
		// Column 4 (REGISTRAZIONE SCHERMO?) is metadata — link is column 3 only.
		const url = parts[2].trim();
		const preview = parts[4]?.trim() || undefined;
		rows.push({ student, title, url, preview });
	}
	return rows;
}

function resolveSlugThumbnail(slug: string): string | null {
	const exts = ['png', 'gif', 'webp'];
	for (const ext of exts) {
		const file = join(THUMB_DIR, `${slug}.${ext}`);
		if (existsSync(file)) return `thumbnails/${slug}.${ext}`;
	}
	return null;
}

export function resolvePreview(filename: string): string | null {
	const trimmed = filename.trim();
	if (!trimmed) return null;
	const name = /\.[a-z0-9]+$/i.test(trimmed) ? trimmed : `${trimmed}.gif`;
	const file = join(GIF_DIR, name);
	if (!existsSync(file)) {
		console.warn(`[build-projects] preview file not found: ${name}`);
		return null;
	}
	return `gifs/${name}`;
}

function resolveThumbnail(slug: string, preview?: string): string | null {
	const slugThumb = resolveSlugThumbnail(slug);
	if (slugThumb) return slugThumb;
	if (preview) return resolvePreview(preview);
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
			thumbnail: resolveThumbnail(slug, row.preview)
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
