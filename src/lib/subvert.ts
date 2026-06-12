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
