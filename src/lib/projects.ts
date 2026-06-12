import projectsData from './projects.json';
import type { Project } from '../../scripts/build-projects';

export type { Project };
export const projects: Project[] = projectsData;

export function getProject(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}

export function randomSlug(current?: string): string {
	const pool =
		current && projects.length > 1
			? projects.filter((p) => p.slug !== current)
			: projects;
	return pool[Math.floor(Math.random() * pool.length)].slug;
}

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export function sortGalleryProjects(
	items: Project[],
	{ random = false }: { random?: boolean } = {}
): Project[] {
	const withThumb = items.filter((p) => p.thumbnail !== null);
	const withoutThumb = items.filter((p) => !p.thumbnail);
	const order = random ? shuffle : <T>(list: T[]) => list;
	return [...order(withThumb), ...order(withoutThumb)];
}
