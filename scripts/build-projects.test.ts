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
