<script lang="ts">
	import { base } from '$app/paths';
	import SubvertPoster from '$lib/components/SubvertPoster.svelte';
	import { posters, ringSlice, randomSectionColors } from '$lib/subvert';

	let pageIndex = $state(0);
	let colors = $state(randomSectionColors());

	const visible = $derived(ringSlice(posters, pageIndex));

	function goPrev() {
		pageIndex -= 1;
		colors = randomSectionColors();
	}

	function goNext() {
		pageIndex += 1;
		colors = randomSectionColors();
	}
</script>

<main class="subvert">
	<header class="topbar">
		<a class="btn" href="{base}/">← Gallery</a>
		<p class="desktop-hint">best on desktop</p>
	</header>

	{#if posters.length === 0}
		<div class="empty">
			<p>No SUBVERT posters yet.</p>
			<a class="btn" href="{base}/">Back to gallery</a>
		</div>
	{:else}
		<div class="columns">
			{#each visible as poster, i (poster.slug + '-' + pageIndex + '-' + i)}
				<SubvertPoster {poster} background={colors[i]} />
			{/each}
		</div>

		<nav class="pager">
			<button class="btn" type="button" onclick={goPrev}>← Prev</button>
			<button class="btn" type="button" onclick={goNext}>Next →</button>
		</nav>
	{/if}
</main>

<style>
	.subvert {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 0 1rem 1.5rem;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: var(--border);
		margin-bottom: 1rem;
	}

	.desktop-hint {
		margin: 0;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--fg-muted);
	}

	.columns {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0;
		min-height: 0;
	}

	.pager {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1.25rem;
	}

	.empty {
		flex: 1;
		display: grid;
		place-content: center;
		gap: 1rem;
		text-align: center;
		font-weight: 700;
		text-transform: uppercase;
	}

	.btn {
		background: transparent;
		color: var(--fg);
		border: var(--border);
		padding: 0.35rem 0.75rem;
		font: inherit;
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		text-decoration: none;
	}

	.btn:hover {
		background: var(--fg);
		color: var(--bg);
	}
</style>
