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
