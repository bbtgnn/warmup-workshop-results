import { describe, it, expect } from 'vitest';
import { buildSubvertPages } from './subvert';
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
