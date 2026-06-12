<script lang="ts">
	let {
		title,
		url,
		class: className = ''
	}: {
		title: string;
		url: string;
		class?: string;
	} = $props();

	let loading = $state(true);
	let embedFailed = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

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

<div class="frame-wrap {className}">
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
