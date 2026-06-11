<script lang="ts">
	import type { Project } from '$lib/projects';
	import { base } from '$app/paths';

	let { project }: { project: Project } = $props();

	let imgError = $state(false);
</script>

<a class="card" href="{base}/p/{project.slug}">
	<div class="media">
		{#if project.thumbnail && !imgError}
			<img
				src={project.thumbnail}
				alt="{project.title} preview"
				onerror={() => (imgError = true)}
			/>
		{:else}
			<img class="placeholder-icon" src="{base}/dumbbell.svg" alt="" />
		{/if}
	</div>
	<h2>{project.title}</h2>
	<p>{project.student}</p>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: var(--border);
		color: inherit;
		text-decoration: none;
		transition: background 0.15s, color 0.15s;
	}

	.card:hover {
		background: var(--fg);
		color: var(--bg);
	}

	.media {
		aspect-ratio: 16 / 10;
		display: grid;
		place-items: center;
		border: 1px solid var(--fg);
		overflow: hidden;
	}

	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-icon {
		width: 40%;
		object-fit: contain;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--fg-muted);
	}

	.card:hover p {
		color: inherit;
		opacity: 0.8;
	}
</style>
