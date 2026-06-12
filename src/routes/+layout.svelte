<script lang="ts">
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="{base}/dumbbell.svg" type="image/svg+xml" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app">
	{@render children()}
</div>

<style>
	:global(:root) {
		--bg: #9400ff;
		--fg: #cccccc;
		--fg-muted: rgb(204 204 204 / 0.7);
		--border: 2px solid var(--fg);
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(html, body) {
		margin: 0;
		min-height: 100%;
		background: var(--bg);
		color: var(--fg);
		font-family: Inter, system-ui, sans-serif;
	}

	.app {
		min-height: 100dvh;
	}
</style>
