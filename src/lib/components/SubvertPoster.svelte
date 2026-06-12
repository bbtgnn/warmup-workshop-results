<script lang="ts">
	import EmbedFrame from '$lib/components/EmbedFrame.svelte';
	import type { EmbedContainSize, SubvertPoster } from '$lib/subvert';

	let {
		poster,
		background,
		containSize = null
	}: {
		poster: SubvertPoster;
		background: string;
		containSize?: EmbedContainSize | null;
	} = $props();

	const displayTitle = $derived(poster.title.trim() || 'Untitled');
	const membersLine = $derived(poster.members.join(' · '));
</script>

<section class="column" style:background>
	<EmbedFrame title={displayTitle} url={poster.url} class="fill-column" {containSize} />
	<div class="meta">
		<h1>{displayTitle}</h1>
		<h3>{poster.teamName}</h3>
		{#if poster.description.trim()}
			<p>{poster.description}</p>
		{/if}
		{#if membersLine}
			<small>{membersLine}</small>
		{/if}
	</div>
</section>

<style>
	.column {
		display: flex;
		flex-direction: column;
		min-width: 0;
		height: 100%;
		min-height: 0;
		padding: 0.5rem;
		color: #000;
	}

	.column :global(.fill-column.frame-wrap) {
		flex: 1;
		min-height: 0;
		aspect-ratio: unset;
		height: auto;
	}

	.column :global(.overlay) {
		font-family: inherit;
		font-size: 0.45rem;
		line-height: 1.6;
	}

	.meta {
		flex-shrink: 0;
		margin-top: 0.5rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 0.6rem;
		line-height: 1.5;
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.5rem;
		line-height: 1.5;
	}

	p {
		margin: 0 0 0.5rem;
		font-size: 0.45rem;
		line-height: 1.6;
	}

	small {
		display: block;
		font-size: 0.4rem;
		line-height: 1.6;
	}
</style>
