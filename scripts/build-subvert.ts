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
