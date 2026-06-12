<script lang="ts">
	import { base } from '$app/paths';
	import SubvertPoster from '$lib/components/SubvertPoster.svelte';
	import { posters, getMainPosters, randomSectionColors } from '$lib/subvert';

	const mainPosters = $derived(getMainPosters(posters));
	const colors = $derived(randomSectionColors(mainPosters.length || 5));
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main class="subvert">
	<header class="topbar">
		<div class="topbar-left">
			<a class="btn" href="{base}/">← Gallery</a>
			<a class="btn" href="{base}/subvert">Columns view</a>
			<a class="btn" href="{base}/subvert/grid">Grid view</a>
		</div>
		<p class="desktop-hint">best on desktop</p>
	</header>

	{#if mainPosters.length === 0}
		<div class="empty">
			<p>No SUBVERT posters yet.</p>
			<a class="btn" href="{base}/">Back to gallery</a>
		</div>
	{:else}
		<div class="line">
			{#each mainPosters as poster, i (poster.slug)}
				<SubvertPoster {poster} background={colors[i]} portraitFrame />
			{/each}
		</div>
	{/if}
</main>

<style>
	.subvert {
		height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 0 0.5rem 0.5rem;
		overflow: hidden;
		font-family: 'Press Start 2P', monospace;
		line-height: 1.6;
	}

	.topbar {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: var(--border);
		margin-bottom: 0.5rem;
	}

	.topbar-left {
		display: flex;
		gap: 0.5rem;
	}

	.desktop-hint {
		margin: 0;
		font-size: 0.5rem;
		text-transform: lowercase;
		color: var(--fg-muted);
	}

	.line {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		grid-template-rows: 1fr;
		gap: 0;
		min-height: 0;
		align-items: stretch;
	}

	.empty {
		flex: 1;
		display: grid;
		place-content: center;
		gap: 1rem;
		text-align: center;
		font-size: 0.55rem;
	}

	.btn {
		background: transparent;
		color: var(--fg);
		border: var(--border);
		padding: 0.5rem 0.75rem;
		font: inherit;
		font-size: 0.55rem;
		cursor: pointer;
		text-decoration: none;
	}

	.btn:hover:not(:disabled) {
		background: var(--fg);
		color: var(--bg);
	}
</style>
