<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { projects, sortGalleryProjects } from '$lib/projects';
	import ProjectCard from '$lib/components/ProjectCard.svelte';

	const SCROLL_SPEED = 50;

	let galleryProjects = $state(sortGalleryProjects(projects));
	let autoScrolling = $state(false);
	let canScroll = $state(false);

	let direction: 1 | -1 = 1;
	let rafId: number | undefined;
	let lastNow = 0;

	function updateCanScroll() {
		canScroll = document.documentElement.scrollHeight > window.innerHeight;
		if (!canScroll) autoScrolling = false;
	}

	function stopAutoScroll() {
		autoScrolling = false;
	}

	function onUserInterrupt() {
		stopAutoScroll();
	}

	function tick(now: number) {
		if (!autoScrolling) return;

		const dt = (now - lastNow) / 1000;
		const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
		const next = window.scrollY + direction * SCROLL_SPEED * dt;

		if (direction === 1 && next >= maxScroll) {
			window.scrollTo(0, maxScroll);
			direction = -1;
		} else if (direction === -1 && next <= 0) {
			window.scrollTo(0, 0);
			direction = 1;
		} else {
			window.scrollTo(0, next);
		}

		lastNow = now;
		rafId = requestAnimationFrame(tick);
	}

	function startLoop() {
		cancelAnimationFrame(rafId ?? 0);
		direction = 1;
		lastNow = performance.now();
		rafId = requestAnimationFrame(tick);
	}

	function stopLoop() {
		cancelAnimationFrame(rafId ?? 0);
		rafId = undefined;
	}

	$effect(() => {
		if (!autoScrolling) return;
		startLoop();
		return () => stopLoop();
	});

	onMount(() => {
		galleryProjects = sortGalleryProjects(projects, { random: true });

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (reducedMotion.matches) {
			canScroll = false;
		} else {
			updateCanScroll();
			window.addEventListener('resize', updateCanScroll);
		}

		const interruptKeys = new Set([
			'ArrowUp',
			'ArrowDown',
			'PageUp',
			'PageDown',
			'Home',
			'End'
		]);

		function onKeyDown(e: KeyboardEvent) {
			if (interruptKeys.has(e.key)) onUserInterrupt();
		}

		window.addEventListener('wheel', onUserInterrupt, { passive: true });
		window.addEventListener('touchmove', onUserInterrupt, { passive: true });
		window.addEventListener('keydown', onKeyDown);

		return () => {
			stopLoop();
			window.removeEventListener('resize', updateCanScroll);
			window.removeEventListener('wheel', onUserInterrupt);
			window.removeEventListener('touchmove', onUserInterrupt);
			window.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<main class="gallery">
	<div class="top-row">
		<button
			class="scroll-btn"
			type="button"
			disabled={!canScroll}
			aria-pressed={autoScrolling}
			onclick={() => (autoScrolling = !autoScrolling)}
		>
			{autoScrolling ? 'STOP SCROLL' : 'AUTO SCROLL'}
		</button>
		<a class="subvert-btn" href="{base}/subvert">SUBVERT</a>
	</div>

	<header>
		<h1>warmup</h1>
		<p class="subtitle">Settimana di workshop · #ABAMC</p>
	</header>

	<div class="grid">
		{#each galleryProjects as project (project.slug)}
			<ProjectCard {project} />
		{/each}
	</div>
</main>

<style>
	.gallery {
		position: relative;
		padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.top-row {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-bottom: -1rem;
	}

	.scroll-btn,
	.subvert-btn {
		display: inline-block;
		background: #000;
		color: #fff;
		border: 2px solid #000;
		padding: 0.6rem 1.25rem;
		font: inherit;
		font-weight: 900;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		text-decoration: none;
	}

	.scroll-btn {
		cursor: pointer;
	}

	.scroll-btn:hover:not(:disabled),
	.subvert-btn:hover {
		background: #fff;
		color: #000;
	}

	.scroll-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	h1 {
		display: inline-block;
		margin: 0;
		padding: 0.25rem 0.75rem;
		border: var(--border);
		font-size: clamp(2rem, 6vw, 3.5rem);
		font-weight: 900;
		text-transform: lowercase;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 1rem 0 0;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.75rem;
		color: var(--fg-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
	}
</style>
