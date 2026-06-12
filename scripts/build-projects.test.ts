import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSlug, normalizeUrl } from './build-projects';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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

describe('source.csv URLs', () => {
	it('does not append REGISTRAZIONE SCHERMO column to links', () => {
		const csv = readFileSync(join(ROOT, 'source.csv'), 'utf8');
		const firstDataLine = csv.trim().split(/\r?\n/)[1];
		const link = firstDataLine.split(',')[2].trim();
		expect(normalizeUrl(link)).toBe('https://menichelliv05-beep.github.io/poster-uccelli/');
		expect(link).not.toMatch(/,SI$/);
	});
});
