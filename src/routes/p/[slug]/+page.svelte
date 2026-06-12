<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { getProject, randomSlug } from '$lib/projects';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const project = $derived(getProject(data.slug));

	let loading = $state(true);
	let embedFailed = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		data.slug;
		loading = true;
		embedFailed = false;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			if (loading) embedFailed = true;
		}, 5000);
		return () => clearTimeout(timeoutId);
	});

	$effect(() => {
		if (!project) return;
		document.documentElement.classList.add('embed-viewer');
		document.body.classList.add('embed-viewer');
		return () => {
			document.documentElement.classList.remove('embed-viewer');
			document.body.classList.remove('embed-viewer');
		};
	});

	function onLoad() {
		loading = false;
		embedFailed = false;
		clearTimeout(timeoutId);
	}

	function goRandom() {
		const next = randomSlug(data.slug);
		goto(`${base}/p/${next}`);
	}

	function openOriginal() {
		if (project) window.open(project.url, '_blank', 'noopener,noreferrer');
	}
</script>

{#if !project}
	<p>Project not found. <a href="{base}/">Back to gallery</a></p>
{:else}
	<div class="viewer">
		<header class="topbar">
			<a class="btn" href="{base}/">← Gallery</a>
			<div class="meta">
				<strong>{project.title}</strong>
				<span>· {project.student}</span>
			</div>
			<div class="actions">
				<button class="btn" type="button" onclick={goRandom}>Random</button>
				<button class="btn" type="button" onclick={openOriginal}>Open ↗</button>
			</div>
		</header>

		<div class="frame-wrap">
			{#if loading}
				<div class="overlay">Loading…</div>
			{/if}
			{#if embedFailed}
				<div class="overlay error">
					<p>Can't embed this project.</p>
					<button class="btn" type="button" onclick={openOriginal}>Open original</button>
				</div>
			{/if}
			<iframe
				title={project.title}
				src={project.url}
				onload={onLoad}
				class:hidden={embedFailed}
			></iframe>
		</div>
	</div>
{/if}

<style>
	:global(html.embed-viewer),
	:global(body.embed-viewer) {
		overflow: hidden;
		overscroll-behavior: none;
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.viewer {
		display: flex;
		flex-direction: column;
		position: fixed;
		inset: 0;
		overflow: hidden;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-bottom: var(--border);
		flex-wrap: wrap;
	}

	.meta {
		flex: 1;
		min-width: 12rem;
		font-size: 0.9rem;
	}

	.meta strong {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
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

	.frame-wrap {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		overscroll-behavior: none;
		touch-action: none;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
		touch-action: none;
	}

	iframe.hidden {
		visibility: hidden;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 1rem;
		background: var(--bg);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.overlay.error p {
		margin: 0;
		text-align: center;
	}
</style>
