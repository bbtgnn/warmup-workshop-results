import { describe, it, expect } from 'vitest';
import {
	parseSubvertCsv,
	makeSubvertSlug,
	expandRows,
	loadGroups,
	type SubvertCsvRow
} from './build-subvert';
import { normalizeUrl } from './build-projects';

const SAMPLE_CSV = `group,title,description,link-1,link-2,link-3,link-4
studio-rombo,Balloon-boy,,https://francescabrillanti-max.github.io/bimbi/,https://remo1112.github.io/balloon/,,
studio-zigzag,Il_Business_del_dolore,,https://christianfoglia.github.io/Poster_Ilbusinessdeldolore_ZigZag/,,,
studio-angolo,,,,,,`;

const SAMPLE_YAML = `
groups:
  - slug: studio-rombo
    name: Studio Rombo
    users:
      - Remo Spadone
  - slug: studio-zigzag
    name: Studio Zigzag
    users:
      - Christian Foglia
  - slug: studio-angolo
    name: Studio Angolo
    users: []
`;

describe('parseSubvertCsv', () => {
	it('parses fixed columns and collects link-N columns in order', () => {
		const rows = parseSubvertCsv(SAMPLE_CSV);
		expect(rows).toHaveLength(3);
		expect(rows[0]).toEqual({
			groupSlug: 'studio-rombo',
			title: 'Balloon-boy',
			description: '',
			links: [
				'https://francescabrillanti-max.github.io/bimbi/',
				'https://remo1112.github.io/balloon/'
			]
		});
	});

	it('skips empty link values', () => {
		const rows = parseSubvertCsv(SAMPLE_CSV);
		expect(rows[1].links).toHaveLength(1);
	});
});

describe('makeSubvertSlug', () => {
	it('slugifies title for first link', () => {
		expect(makeSubvertSlug('Balloon-boy', 'studio-rombo', 2, 0)).toBe('balloon-boy');
	});

	it('suffixes additional links on same row', () => {
		expect(makeSubvertSlug('Balloon-boy', 'studio-rombo', 2, 1)).toBe('balloon-boy-2');
	});

	it('uses group and row index when title empty', () => {
		expect(makeSubvertSlug('', 'studio-angolo', 4, 0)).toBe('studio-angolo-4');
	});
});

describe('loadGroups', () => {
	it('indexes groups by slug', () => {
		const map = loadGroups(SAMPLE_YAML);
		expect(map.get('studio-rombo')?.name).toBe('Studio Rombo');
		expect(map.get('studio-rombo')?.users).toEqual(['Remo Spadone']);
	});
});

describe('expandRows', () => {
	it('expands links into separate poster entries with team join', () => {
		const rows = parseSubvertCsv(SAMPLE_CSV);
		const groups = loadGroups(SAMPLE_YAML);
		const posters = expandRows(rows, groups, normalizeUrl);
		expect(posters).toHaveLength(3);
		expect(posters[0]).toMatchObject({
			slug: 'balloon-boy',
			title: 'Balloon-boy',
			url: 'https://francescabrillanti-max.github.io/bimbi/',
			groupSlug: 'studio-rombo',
			teamName: 'Studio Rombo',
			members: ['Remo Spadone']
		});
		expect(posters[1].slug).toBe('balloon-boy-2');
	});

	it('skips rows with no valid links', () => {
		const rows = parseSubvertCsv(SAMPLE_CSV);
		const groups = loadGroups(SAMPLE_YAML);
		const posters = expandRows(rows, groups, normalizeUrl);
		expect(posters.find((p) => p.groupSlug === 'studio-angolo')).toBeUndefined();
	});

	it('throws on unknown group slug', () => {
		const rows: SubvertCsvRow[] = [
			{ groupSlug: 'unknown', title: 'X', description: '', links: ['https://example.com'] }
		];
		const groups = loadGroups(SAMPLE_YAML);
		expect(() => expandRows(rows, groups, normalizeUrl)).toThrow(/unknown group/i);
	});

	it('throws on duplicate slug', () => {
		const rows: SubvertCsvRow[] = [
			{ groupSlug: 'studio-rombo', title: 'Same', description: '', links: ['https://a.com'] },
			{ groupSlug: 'studio-zigzag', title: 'Same', description: '', links: ['https://b.com'] }
		];
		const groups = loadGroups(SAMPLE_YAML);
		expect(() => expandRows(rows, groups, normalizeUrl)).toThrow(/duplicate slug/i);
	});
});
