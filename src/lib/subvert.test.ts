import { describe, it, expect } from 'vitest';
import { ringSlice } from './subvert';

describe('ringSlice', () => {
	const items = ['a', 'b', 'c', 'd', 'e'];

	it('returns first page at pageIndex 0', () => {
		expect(ringSlice(items, 0)).toEqual(['a', 'b', 'c']);
	});

	it('wraps forward at pageIndex 1', () => {
		expect(ringSlice(items, 1)).toEqual(['d', 'e', 'a']);
	});

	it('wraps backward at pageIndex -1', () => {
		expect(ringSlice(items, -1)).toEqual(['c', 'd', 'e']);
	});
});
