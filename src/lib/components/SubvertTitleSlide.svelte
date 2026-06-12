<script lang="ts">
	let titleWrap: HTMLDivElement | undefined;
	let titleEl: HTMLHeadingElement | undefined;

	function fitTitle() {
		if (!titleWrap || !titleEl) return;

		const lines = titleEl.querySelectorAll<HTMLElement>('.line');
		if (lines.length === 0) return;

		const maxWidth = titleWrap.clientWidth;
		if (maxWidth <= 0) return;

		let lo = 8;
		let hi = maxWidth;

		while (lo < hi) {
			const mid = Math.ceil((lo + hi) / 2);
			titleEl.style.fontSize = `${mid}px`;
			const fits = [...lines].every((line) => line.scrollWidth <= maxWidth);
			if (fits) lo = mid;
			else hi = mid - 1;
		}

		titleEl.style.fontSize = `${lo}px`;
	}

	$effect(() => {
		if (!titleWrap || !titleEl) return;

		void document.fonts.ready.then(fitTitle);

		const ro = new ResizeObserver(() => fitTitle());
		ro.observe(titleWrap);
		return () => ro.disconnect();
	});
</script>

<section class="column">
	<div class="title-wrap" bind:this={titleWrap}>
		<h1 bind:this={titleEl}>
			<span class="line">subversive</span>
			<span class="line">coding</span>
		</h1>
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
		background: transparent;
	}

	.title-wrap {
		flex: 1;
		display: grid;
		place-content: center;
		min-height: 0;
		width: 100%;
		padding: 0.75rem;
	}

	h1 {
		margin: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35em;
		line-height: 1;
		text-transform: lowercase;
		transform: rotate(-5deg);
	}

	.line {
		display: block;
		white-space: nowrap;
	}
</style>
