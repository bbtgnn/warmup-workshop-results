import subvertData from './subvert.json';
import type { SubvertPoster } from '../../scripts/build-subvert';

export type { SubvertPoster };
export const posters: SubvertPoster[] = subvertData;

const PAGE_SIZE = 3;
export const GRID_SIZE = 6;

export type SubvertSlot =
	| { type: 'title' }
	| { type: 'poster'; poster: SubvertPoster };

export type SubvertGridSlot =
	| { type: 'title' }
	| { type: 'poster'; poster: SubvertPoster }
	| { type: 'empty' };

function groupPostersByTeam(items: SubvertPoster[]): SubvertPoster[][] {
	const order: string[] = [];
	const byGroup = new Map<string, SubvertPoster[]>();

	for (const poster of items) {
		if (!byGroup.has(poster.groupSlug)) {
			order.push(poster.groupSlug);
			byGroup.set(poster.groupSlug, []);
		}
		byGroup.get(poster.groupSlug)!.push(poster);
	}

	return order.map((slug) => byGroup.get(slug)!);
}

/** Page 1: title + first link for 2 groups. Page 2: first link for 3 groups. Then extra links, 3 per page. */
export function buildSubvertPages(items: SubvertPoster[]): SubvertSlot[][] {
	if (items.length === 0) return [];

	const groups = groupPostersByTeam(items);
	const firstLinks = groups.map((group) => group[0]);
	const overflow = groups.flatMap((group) => group.slice(1));
	const pages: SubvertSlot[][] = [];

	const pageOne: SubvertSlot[] = [{ type: 'title' }];
	for (const poster of firstLinks.slice(0, 2)) {
		pageOne.push({ type: 'poster', poster });
	}
	pages.push(pageOne);

	const pageTwo = firstLinks.slice(2, 5).map((poster) => ({ type: 'poster' as const, poster }));
	if (pageTwo.length > 0) pages.push(pageTwo);

	for (let i = 0; i < overflow.length; i += PAGE_SIZE) {
		pages.push(
			overflow.slice(i, i + PAGE_SIZE).map((poster) => ({ type: 'poster' as const, poster }))
		);
	}

	return pages;
}

function padToGridSize(slots: SubvertGridSlot[]): SubvertGridSlot[] {
	const padded: SubvertGridSlot[] = [...slots];
	while (padded.length < GRID_SIZE) {
		padded.push({ type: 'empty' });
	}
	return padded.slice(0, GRID_SIZE);
}

/** Page 1: title + first link per group (up to 5) in a 3×2 grid. Later pages: overflow links, 6 per page. */
export function buildSubvertGridPages(items: SubvertPoster[]): SubvertGridSlot[][] {
	if (items.length === 0) return [];

	const groups = groupPostersByTeam(items);
	const firstLinks = groups.map((group) => group[0]);
	const overflow = groups.flatMap((group) => group.slice(1));
	const pages: SubvertGridSlot[][] = [];

	const pageOne: SubvertGridSlot[] = [
		{ type: 'title' },
		...firstLinks.slice(0, 5).map((poster) => ({ type: 'poster' as const, poster }))
	];
	pages.push(padToGridSize(pageOne));

	for (let i = 0; i < overflow.length; i += GRID_SIZE) {
		const chunk = overflow
			.slice(i, i + GRID_SIZE)
			.map((poster) => ({ type: 'poster' as const, poster }));
		pages.push(padToGridSize(chunk));
	}

	return pages;
}

const ACID_HUES = [52, 85, 120, 165, 195, 280, 305, 330];

export function randomSectionColors(count = PAGE_SIZE): string[] {
	const colors: string[] = [];
	while (colors.length < count) {
		const base = ACID_HUES[Math.floor(Math.random() * ACID_HUES.length)];
		const h = (base + Math.floor(Math.random() * 24) - 12 + 360) % 360;
		const s = 100;
		const l = 46 + Math.floor(Math.random() * 14);
		const color = `hsl(${h} ${s}% ${l}%)`;
		if (!colors.includes(color)) colors.push(color);
	}
	return colors;
}
