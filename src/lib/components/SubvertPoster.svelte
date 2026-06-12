<script lang="ts">
	import EmbedFrame from '$lib/components/EmbedFrame.svelte';
	import type { SubvertPoster } from '$lib/subvert';

	let {
		poster,
		background
	}: {
		poster: SubvertPoster;
		background: string;
	} = $props();

	const displayTitle = $derived(poster.title.trim() || 'Untitled');
	const membersLine = $derived(poster.members.join(' · '));
</script>

<section class="column" style:background>
	<EmbedFrame title={displayTitle} url={poster.url} class="fill-column" />
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
		color: #fff;
	}

	.column :global(.fill-column.frame-wrap) {
		flex: 1;
		min-height: 0;
		aspect-ratio: unset;
		height: auto;
	}

	.meta {
		flex-shrink: 0;
		margin-top: 0.5rem;
		text-shadow: 0 1px 3px rgb(0 0 0 / 0.45);
	}

	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.1rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	h3 {
		margin: 0 0 0.35rem;
		font-size: 0.85rem;
		font-weight: 700;
	}

	p {
		margin: 0 0 0.35rem;
		font-size: 0.8rem;
		line-height: 1.45;
	}

	small {
		display: block;
		font-size: 0.7rem;
		opacity: 0.85;
		line-height: 1.4;
	}
</style>
