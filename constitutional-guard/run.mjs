import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const guardRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(guardRoot);
const acceptedPhases = new Set(['prebuild', 'postbuild', 'integrity', 'all']);

async function sha256(filePath) {
	const content = await readFile(filePath);
	return createHash('sha256').update(content).digest('hex');
}

async function loadManifest() {
	const manifestPath = path.join(guardRoot, 'history/manifest.json');
	return JSON.parse(await readFile(manifestPath, 'utf8'));
}

async function verifyHistoricalIntegrity(manifest) {
	const registeredHistory = new Set(
		manifest.historicalTests.map((entry) => path.normalize(entry.path)),
	);
	const historyDirectory = path.join(guardRoot, 'history');
	const actualHistory = (await readdir(historyDirectory))
		.filter((name) => name.endsWith('.test.mjs'))
		.map((name) => path.normalize(`history/${name}`));

	for (const file of actualHistory) {
		if (!registeredHistory.has(file)) {
			throw new Error(`Unregistered historical test: ${file}`);
		}
	}

	for (const entry of [...manifest.historicalTests, ...manifest.protectedInterfaces]) {
		const absolutePath = path.join(guardRoot, entry.path);
		const actualHash = await sha256(absolutePath);
		if (actualHash !== entry.sha256) {
			throw new Error(
				`Historical integrity mismatch for ${entry.path}. Expected ${entry.sha256}, received ${actualHash}.`,
			);
		}
	}

	const activeIds = new Set(
		manifest.historicalTests
			.filter((entry) => (entry.status ?? 'active') === 'active')
			.map((entry) => entry.id),
	);

	for (const entry of manifest.historicalTests) {
		const status = entry.status ?? 'active';
		if (status !== 'active' && status !== 'superseded') {
			throw new Error(`Historical test ${entry.id} has unknown status "${status}".`);
		}

		if (
			status === 'superseded' &&
			(typeof entry.supersededBy !== 'string' || !activeIds.has(entry.supersededBy))
		) {
			throw new Error(`Historical test ${entry.id} must name an active successor in supersededBy.`);
		}
	}
}

async function isPublicProjection() {
	try {
		await access(path.join(projectRoot, 'VOX-PUBLICATION.json'));
		return true;
	} catch {
		return false;
	}
}

async function currentTestsForPhase(phase, publicProjection) {
	const directory = publicProjection
		? path.join(guardRoot, 'tests', 'public', phase)
		: path.join(guardRoot, 'tests', phase);
	return (await readdir(directory))
		.filter((name) => name.endsWith('.test.mjs'))
		.toSorted()
		.map((name) => path.join(directory, name));
}

async function runTests(testFiles, phase, publicProjection) {
	if (testFiles.length === 0) {
		throw new Error(`No ${phase} tests were collected.`);
	}

	console.log(`IRON WARDEN / ${phase.toUpperCase()} / ${testFiles.length} TEST FILES`);

	await new Promise((resolve, reject) => {
		const child = spawn(process.execPath, ['--test', ...testFiles], {
			cwd: projectRoot,
			env: {
				...process.env,
				IRON_WARDEN_PROJECT_ROOT: projectRoot,
				IRON_WARDEN_SURFACE: publicProjection ? 'public' : 'canonical',
			},
			stdio: 'inherit',
		});

		child.on('error', reject);
		child.on('exit', (code, signal) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(
				new Error(`IRON WARDEN stopped ${phase}: ${signal ? `signal ${signal}` : `exit ${code}`}.`),
			);
		});
	});
}

async function runPhase(phase, manifest, publicProjection) {
	const historicalTests = publicProjection
		? []
		: manifest.historicalTests
				.filter((entry) => entry.phase === phase && (entry.status ?? 'active') === 'active')
				.map((entry) => path.join(guardRoot, entry.path));
	const currentTests = await currentTestsForPhase(phase, publicProjection);

	await runTests([...historicalTests, ...currentTests], phase, publicProjection);
}

async function main() {
	const phase = process.argv[2] ?? 'all';
	if (!acceptedPhases.has(phase)) {
		throw new Error(`Unknown IRON WARDEN phase "${phase}".`);
	}

	const manifest = await loadManifest();
	await verifyHistoricalIntegrity(manifest);
	const publicProjection = await isPublicProjection();

	if (phase === 'prebuild' || phase === 'all') {
		await runPhase('prebuild', manifest, publicProjection);
	}

	if (phase === 'postbuild' || phase === 'all') {
		await runPhase('postbuild', manifest, publicProjection);
	}

	console.log(`IRON WARDEN / ${phase.toUpperCase()} / PASS`);
}

main().catch((error) => {
	console.error(`IRON WARDEN / REFUSAL\n${error instanceof Error ? error.message : error}`);
	process.exitCode = 1;
});
