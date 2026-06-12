import subvertData from './subvert.json';
import type { SubvertPoster } from '../../scripts/build-subvert';

export type { SubvertPoster };
export const posters: SubvertPoster[] = subvertData;

const PAGE_SIZE = 3;

export function ringSlice<T>(items: T[], pageIndex: number, pageSize = PAGE_SIZE): T[] {
	const n = items.length;
	if (n === 0) return [];
	const start = ((pageIndex * pageSize) % n + n) % n;
	return Array.from({ length: pageSize }, (_, i) => items[(start + i) % n]);
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
