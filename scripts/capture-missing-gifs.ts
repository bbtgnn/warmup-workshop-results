import { execFileSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import type { Project } from './build-projects';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECTS_PATH = join(ROOT, 'src/lib/projects.json');
const THUMB_DIR = join(ROOT, 'static/thumbnails');

const VIEWPORT = { width: 640, height: 640 };
const DURATION_MS = 5_000;
const FPS = 10;
const SETTLE_MS = 500;
const GOTO_TIMEOUT_MS = 60_000;

const FFMPEG_FILTER =
	'scale=640:640:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer';

export type CaptureOptions = {
	slug?: string;
	force?: boolean;
	existingThumbs?: Set<string>;
};

export function listCaptureTargets(
	projects: Project[],
	{ slug, force = false, existingThumbs }: CaptureOptions = {}
): Project[] {
	let targets = projects.filter((p) => p.thumbnail === null);

	if (slug) {
		const match = projects.find((p) => p.slug === slug);
		if (!match) throw new Error(`Unknown slug: ${slug}`);
		if (match.thumbnail !== null) {
			throw new Error(`Project "${slug}" already has a thumbnail`);
		}
		targets = targets.filter((p) => p.slug === slug);
	}

	if (!force && existingThumbs) {
		targets = targets.filter((p) => !existingThumbs.has(p.slug));
	}

	return targets;
}

export function scanExistingThumbs(thumbDir: string): Set<string> {
	const slugs = new Set<string>();
	if (!existsSync(thumbDir)) return slugs;
	for (const name of readdirSync(thumbDir)) {
		const match = name.match(/^(.+)\.(gif|png|webp)$/i);
		if (match) slugs.add(match[1]);
	}
	return slugs;
}

function loadProjects(): Project[] {
	return JSON.parse(readFileSync(PROJECTS_PATH, 'utf8')) as Project[];
}

function parseArgs(argv: string[]): { slug?: string; dryRun: boolean; force: boolean } {
	let slug: string | undefined;
	let dryRun = false;
	let force = false;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--dry-run') dryRun = true;
		else if (arg === '--force') force = true;
		else if (arg === '--slug') slug = argv[++i];
	}

	return { slug, dryRun, force };
}

function checkFfmpeg(): void {
	try {
		execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
	} catch {
		console.error('[capture-missing-gifs] ffmpeg not found on PATH.');
		console.error('Install it first, e.g. brew install ffmpeg');
		process.exit(1);
	}
}

function padFrame(index: number): string {
	return String(index).padStart(4, '0');
}

function thumbPath(slug: string): string {
	return join(THUMB_DIR, `${slug}.gif`);
}

async function captureProject(
	project: Project,
	browser: Awaited<ReturnType<typeof chromium.launch>>
): Promise<void> {
	const out = thumbPath(project.slug);
	const tmp = mkdtempSync(join(tmpdir(), 'gif-capture-'));
	const frameCount = (DURATION_MS / 1000) * FPS;

	try {
		const page = await browser.newPage({ viewport: VIEWPORT });
		try {
			await page.goto(project.url, {
				waitUntil: 'domcontentloaded',
				timeout: GOTO_TIMEOUT_MS
			});
			await page.waitForTimeout(SETTLE_MS);

			for (let i = 0; i < frameCount; i++) {
				await page.screenshot({ path: join(tmp, `frame-${padFrame(i)}.png`) });
				if (i < frameCount - 1) {
					await page.waitForTimeout(1000 / FPS);
				}
			}
		} finally {
			await page.close();
		}

		execFileSync(
			'ffmpeg',
			[
				'-y',
				'-framerate',
				String(FPS),
				'-i',
				join(tmp, 'frame-%04d.png'),
				'-vf',
				FFMPEG_FILTER,
				'-loop',
				'0',
				out
			],
			{ stdio: 'ignore' }
		);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

async function main(): Promise<void> {
	const { slug, dryRun, force } = parseArgs(process.argv.slice(2));
	const projects = loadProjects();
	const existingThumbs = scanExistingThumbs(THUMB_DIR);

	let targets: Project[];
	try {
		targets = listCaptureTargets(projects, { slug, force, existingThumbs });
	} catch (err) {
		console.error(`[capture-missing-gifs] ${(err as Error).message}`);
		process.exit(1);
	}

	const skipped = projects.filter(
		(p) =>
			p.thumbnail === null &&
			existingThumbs.has(p.slug) &&
			!force &&
			(!slug || p.slug === slug)
	);

	if (targets.length === 0) {
		console.log('[capture-missing-gifs] No projects to capture.');
		if (skipped.length > 0) {
			console.log(
				`  ${skipped.length} skipped (thumbnail file already exists; use --force to overwrite)`
			);
		}
		return;
	}

	console.log(`[capture-missing-gifs] ${targets.length} project(s) to capture`);
	for (const p of targets) {
		console.log(`  - ${p.slug} → ${p.url}`);
	}

	if (dryRun) return;

	checkFfmpeg();
	mkdirSync(THUMB_DIR, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const succeeded: string[] = [];
	const failed: Array<{ slug: string; error: string }> = [];

	try {
		for (const project of targets) {
			try {
				await captureProject(project, browser);
				console.log(`OK  ${project.slug}`);
				succeeded.push(project.slug);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`FAIL ${project.slug}: ${project.url}`);
				console.error(`     ${message}`);
				failed.push({ slug: project.slug, error: message });
			}
		}
	} finally {
		await browser.close();
	}

	console.log('');
	console.log('[capture-missing-gifs] Summary');
	console.log(`  succeeded: ${succeeded.length}`);
	console.log(`  failed:    ${failed.length}`);
	console.log(`  skipped:   ${skipped.length}`);
	if (succeeded.length > 0) {
		console.log('');
		console.log('Next: npm run generate && npm run build');
	}

	if (failed.length > 0) process.exit(1);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	main().catch((err) => {
		console.error('[capture-missing-gifs] fatal:', err);
		process.exit(1);
	});
}
