<script lang="ts">
	import type { EmbedContainSize } from '$lib/subvert';

	let {
		title,
		url,
		class: className = '',
		containSize = null
	}: {
		title: string;
		url: string;
		class?: string;
		containSize?: EmbedContainSize | null;
	} = $props();

	let frameWrap: HTMLDivElement | undefined;
	let loading = $state(true);
	let embedFailed = $state(false);
	let containScale = $state(1);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function updateContainScale() {
		if (!frameWrap || !containSize) return;
		containScale = Math.min(
			frameWrap.clientWidth / containSize.width,
			frameWrap.clientHeight / containSize.height
		);
	}

	$effect(() => {
		containSize;
		frameWrap;
		if (!frameWrap || !containSize) return;

		updateContainScale();
		const ro = new ResizeObserver(() => updateContainScale());
		ro.observe(frameWrap);
		return () => ro.disconnect();
	});

	$effect(() => {
		url;
		loading = true;
		embedFailed = false;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			if (loading) embedFailed = true;
		}, 5000);
		return () => clearTimeout(timeoutId);
	});

	function onLoad() {
		loading = false;
		embedFailed = false;
		clearTimeout(timeoutId);
	}

	function openOriginal() {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

<div
	class="frame-wrap {className}"
	class:fit-contain={containSize !== null}
	bind:this={frameWrap}
	style:--contain-scale={containScale}
	style:--content-width="{containSize?.width ?? 0}px"
	style:--content-height="{containSize?.height ?? 0}px"
>
	{#if loading}
		<div class="overlay">Loading…</div>
	{/if}
	{#if embedFailed}
		<div class="overlay error">
			<p>Can't embed this project.</p>
			<button class="btn" type="button" onclick={openOriginal}>Open original</button>
		</div>
	{/if}
	<iframe {title} src={url} onload={onLoad} class:hidden={embedFailed}></iframe>
</div>

<style>
	.frame-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #111;
	}

	:global(.fill-column.frame-wrap) {
		flex: 1;
		min-height: 0;
		aspect-ratio: unset;
		height: auto;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
	}

	.fit-contain iframe {
		position: absolute;
		top: 50%;
		left: 50%;
		width: var(--content-width);
		height: var(--content-height);
		transform: translate(-50%, -50%) scale(var(--contain-scale));
		transform-origin: center center;
	}

	iframe.hidden {
		visibility: hidden;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		background: rgb(0 0 0 / 0.85);
		color: #fff;
		font-weight: 700;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.overlay.error p {
		margin: 0;
		text-align: center;
	}

	.btn {
		background: transparent;
		color: inherit;
		border: 2px solid currentColor;
		padding: 0.35rem 0.75rem;
		font: inherit;
		cursor: pointer;
	}
</style>
