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
