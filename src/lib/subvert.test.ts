import { describe, it, expect } from 'vitest';
import { buildSubvertPages, buildSubvertGridPages, getMainPosters } from './subvert';
import type { SubvertPoster } from './subvert';

function poster(groupSlug: string, slug: string, linkIndex = 0): SubvertPoster {
	return {
		slug,
		title: slug,
		description: '',
		url: `https://example.com/${slug}`,
		groupSlug,
		teamName: groupSlug,
		members: []
	};
}

describe('getMainPosters', () => {
	const fiveGroups = [
		poster('a', 'a-1'),
		poster('a', 'a-2'),
		poster('b', 'b-1'),
		poster('c', 'c-1'),
		poster('d', 'd-1'),
		poster('e', 'e-1')
	];

	it('returns the first poster from each group', () => {
		expect(getMainPosters(fiveGroups)).toEqual([
			fiveGroups[0],
			fiveGroups[2],
			fiveGroups[3],
			fiveGroups[4],
			fiveGroups[5]
		]);
	});

	it('returns empty array when there are no posters', () => {
		expect(getMainPosters([])).toEqual([]);
	});
});

describe('buildSubvertPages', () => {
	const fiveGroups = [
		poster('a', 'a-1'),
		poster('a', 'a-2'),
		poster('b', 'b-1'),
		poster('c', 'c-1'),
		poster('d', 'd-1'),
		poster('e', 'e-1')
	];

	it('puts title plus two first links on page one', () => {
		const pages = buildSubvertPages(fiveGroups);
		expect(pages[0]).toEqual([
			{ type: 'title' },
			{ type: 'poster', poster: fiveGroups[0] },
			{ type: 'poster', poster: fiveGroups[2] }
		]);
	});

	it('puts three remaining first links on page two', () => {
		const pages = buildSubvertPages(fiveGroups);
		expect(pages[1]).toEqual([
			{ type: 'poster', poster: fiveGroups[3] },
			{ type: 'poster', poster: fiveGroups[4] },
			{ type: 'poster', poster: fiveGroups[5] }
		]);
	});

	it('puts extra links on later pages', () => {
		const pages = buildSubvertPages(fiveGroups);
		expect(pages[2]).toEqual([{ type: 'poster', poster: fiveGroups[1] }]);
	});

	it('returns empty array when there are no posters', () => {
		expect(buildSubvertPages([])).toEqual([]);
	});
});

describe('buildSubvertGridPages', () => {
	const fiveGroups = [
		poster('a', 'a-1'),
		poster('a', 'a-2'),
		poster('b', 'b-1'),
		poster('c', 'c-1'),
		poster('d', 'd-1'),
		poster('e', 'e-1')
	];

	const emptySlots = Array.from({ length: 5 }, () => ({ type: 'empty' as const }));

	it('puts title plus five first links on page one in row-major order', () => {
		const pages = buildSubvertGridPages(fiveGroups);
		expect(pages[0]).toEqual([
			{ type: 'title' },
			{ type: 'poster', poster: fiveGroups[0] },
			{ type: 'poster', poster: fiveGroups[2] },
			{ type: 'poster', poster: fiveGroups[3] },
			{ type: 'poster', poster: fiveGroups[4] },
			{ type: 'poster', poster: fiveGroups[5] }
		]);
	});

	it('puts overflow posters top-left on page two with trailing empty slots', () => {
		const pages = buildSubvertGridPages(fiveGroups);
		expect(pages[1]).toEqual([
			{ type: 'poster', poster: fiveGroups[1] },
			...emptySlots
		]);
	});

	it('returns empty array when there are no posters', () => {
		expect(buildSubvertGridPages([])).toEqual([]);
	});
});
