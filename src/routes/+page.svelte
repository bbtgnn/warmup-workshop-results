<script lang="ts">
	import { projects } from '$lib/projects';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
</script>

<main class="gallery">
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
		padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
		max-width: 1400px;
		margin: 0 auto;
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
