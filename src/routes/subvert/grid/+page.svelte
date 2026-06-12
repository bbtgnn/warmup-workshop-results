<script lang="ts">
	import { base } from '$app/paths';
	import SubvertPoster from '$lib/components/SubvertPoster.svelte';
	import SubvertTitleSlide from '$lib/components/SubvertTitleSlide.svelte';
	import {
		posters,
		buildSubvertGridPages,
		getEmbedContainSize,
		randomSectionColors
	} from '$lib/subvert';

	let pageIndex = $state(0);

	const pages = $derived(buildSubvertGridPages(posters));
	const visible = $derived(pages[pageIndex] ?? []);
	const colors = $derived.by(() => {
		pageIndex;
		return randomSectionColors(6);
	});
	const atStart = $derived(pageIndex === 0);
	const atEnd = $derived(pageIndex >= pages.length - 1);

	function goPrev() {
		if (atStart) return;
		pageIndex -= 1;
	}

	function goNext() {
		if (atEnd) return;
		pageIndex += 1;
	}
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
			<a class="btn" href="{base}/subvert/line">Line view</a>
		</div>
		<p class="desktop-hint">best on desktop</p>
	</header>

	{#if posters.length === 0}
		<div class="empty">
			<p>No SUBVERT posters yet.</p>
			<a class="btn" href="{base}/">Back to gallery</a>
		</div>
	{:else}
		<div class="grid">
			{#each visible as slot, i (`${pageIndex}-${i}-${slot.type === 'title' ? 'title' : slot.type === 'empty' ? 'empty' : slot.poster.slug}`)}
				{#if slot.type === 'title'}
					<SubvertTitleSlide />
				{:else if slot.type === 'poster'}
					<SubvertPoster
						poster={slot.poster}
						background={colors[i]}
						containSize={getEmbedContainSize(slot.poster.slug)}
					/>
				{:else}
					<div class="empty-cell" aria-hidden="true"></div>
				{/if}
			{/each}
		</div>

		<nav class="pager">
			<button class="btn" type="button" onclick={goPrev} disabled={atStart}>← Prev</button>
			<button class="btn" type="button" onclick={goNext} disabled={atEnd}>Next →</button>
		</nav>
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

	.grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 0;
		min-height: 0;
		align-items: stretch;
	}

	.empty-cell {
		min-width: 0;
		min-height: 0;
	}

	.pager {
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.5rem;
		padding-top: 0.25rem;
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

	.btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
</style>
