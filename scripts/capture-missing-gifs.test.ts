import { describe, it, expect } from 'vitest';
import type { Project } from './build-projects';
import { listCaptureTargets } from './capture-missing-gifs';

const sample: Project[] = [
	{
		slug: 'has-thumb',
		student: 'A',
		title: 'With thumb',
		url: 'https://example.com/a',
		thumbnail: '/warmup-results/gifs/foo.gif'
	},
	{
		slug: 'missing-one',
		student: 'B',
		title: 'Missing',
		url: 'https://example.com/b',
		thumbnail: null
	},
	{
		slug: 'missing-two',
		student: 'C',
		title: 'Also missing',
		url: 'https://example.com/c',
		thumbnail: null
	}
];

describe('listCaptureTargets', () => {
	it('returns only projects with null thumbnail', () => {
		const targets = listCaptureTargets(sample);
		expect(targets.map((p) => p.slug)).toEqual(['missing-one', 'missing-two']);
	});

	it('skips slugs that already have a thumbnail file', () => {
		const existing = new Set(['missing-one']);
		const targets = listCaptureTargets(sample, { existingThumbs: existing });
		expect(targets.map((p) => p.slug)).toEqual(['missing-two']);
	});

	it('includes existing slugs when force is true', () => {
		const existing = new Set(['missing-one']);
		const targets = listCaptureTargets(sample, { existingThumbs: existing, force: true });
		expect(targets.map((p) => p.slug)).toEqual(['missing-one', 'missing-two']);
	});

	it('filters to a single slug', () => {
		const targets = listCaptureTargets(sample, { slug: 'missing-two' });
		expect(targets.map((p) => p.slug)).toEqual(['missing-two']);
	});

	it('throws for unknown slug', () => {
		expect(() => listCaptureTargets(sample, { slug: 'nope' })).toThrow('Unknown slug');
	});

	it('throws when slug already has thumbnail in projects.json', () => {
		expect(() => listCaptureTargets(sample, { slug: 'has-thumb' })).toThrow(
			'already has a thumbnail'
		);
	});
});
