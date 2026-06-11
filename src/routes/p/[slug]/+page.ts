import { projects } from '$lib/projects';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return projects.map((p) => ({ slug: p.slug }));
};

export const load: PageLoad = ({ params }) => {
	return { slug: params.slug };
};
