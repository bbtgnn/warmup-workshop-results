<script lang="ts">
	import EmbedFrame from '$lib/components/EmbedFrame.svelte';
	import { PORTRAIT_EMBED_SIZE, type EmbedContainSize, type SubvertPoster } from '$lib/subvert';

	let {
		poster,
		background,
		containSize = null,
		showMeta = true,
		portraitFrame = false
	}: {
		poster: SubvertPoster;
		background: string;
		containSize?: EmbedContainSize | null;
		showMeta?: boolean;
		portraitFrame?: boolean;
	} = $props();

	const displayTitle = $derived(poster.title.trim() || 'Untitled');
	const membersLine = $derived(poster.members.join(' · '));
	const frameClass = $derived(portraitFrame ? 'portrait-frame' : 'fill-column');
	const frameContainSize = $derived(
		portraitFrame ? (containSize ?? PORTRAIT_EMBED_SIZE) : containSize
	);
</script>

<section class="column" class:portrait={portraitFrame} style:background>
	<EmbedFrame title={displayTitle} url={poster.url} class={frameClass} containSize={frameContainSize} />
	{#if showMeta}
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
	{/if}
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

	.column.portrait {
		align-items: center;
	}

	.column :global(.fill-column.frame-wrap) {
		flex: 1;
		min-height: 0;
		aspect-ratio: unset;
		height: auto;
	}

	.column :global(.portrait-frame.frame-wrap) {
		flex: 1 1 auto;
		min-height: 0;
		min-width: 0;
		width: auto;
		height: 100%;
		max-width: 100%;
		aspect-ratio: 1080 / 1920;
		margin-inline: auto;
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
