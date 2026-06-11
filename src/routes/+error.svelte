<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
</script>

<main class="error">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message ?? 'Page not found'}</p>
	<a class="btn" href="{base}/">← Gallery</a>
</main>

<style>
	.error {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		text-align: center;
		gap: 1rem;
		padding: 2rem;
	}

	h1 {
		margin: 0;
		font-size: 4rem;
		font-weight: 900;
	}

	.btn {
		justify-self: center;
		background: transparent;
		color: var(--fg);
		border: var(--border);
		padding: 0.5rem 1rem;
		font-weight: 700;
		text-transform: uppercase;
		text-decoration: none;
	}
</style>
