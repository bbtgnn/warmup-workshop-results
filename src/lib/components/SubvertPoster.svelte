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
	<EmbedFrame title={displayTitle} url={poster.url} />
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
		padding: 1rem;
		color: #111;
	}

	.meta {
		margin-top: 0.75rem;
	}

	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.25rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.95rem;
		font-weight: 700;
	}

	p {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		line-height: 1.45;
	}

	small {
		display: block;
		font-size: 0.75rem;
		opacity: 0.85;
		line-height: 1.4;
	}
</style>
