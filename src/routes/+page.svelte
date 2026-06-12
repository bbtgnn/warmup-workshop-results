<script lang="ts">
	import { base } from '$app/paths';
	import { projects } from '$lib/projects';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
</script>

<main class="gallery">
	<div class="top-row">
		<a class="subvert-btn" href="{base}/subvert">SUBVERT</a>
	</div>

	<header>
		<h1>warmup</h1>
		<p class="subtitle">Settimana di workshop · #ABAMC</p>
	</header>

	<div class="grid">
		{#each projects as project (project.slug)}
			<ProjectCard {project} />
		{/each}
	</div>
</main>

<style>
	.gallery {
		position: relative;
		padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.top-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: -1rem;
	}

	.subvert-btn {
		display: inline-block;
		background: #000;
		color: #fff;
		border: 2px solid #000;
		padding: 0.6rem 1.25rem;
		font: inherit;
		font-weight: 900;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		text-decoration: none;
	}

	.subvert-btn:hover {
		background: #fff;
		color: #000;
	}

	header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	h1 {
		display: inline-block;
		margin: 0;
		padding: 0.25rem 0.75rem;
		border: var(--border);
		font-size: clamp(2rem, 6vw, 3.5rem);
		font-weight: 900;
		text-transform: lowercase;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 1rem 0 0;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.75rem;
		color: var(--fg-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
	}
</style>
