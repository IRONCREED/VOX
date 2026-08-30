import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0040: release 1.9.0 seals the service story and same-origin anthem', async () => {
	const [packageManifest, corpus, pages, audio, brand] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('semantic-core/corpus/pages/registry.json'),
		readJson('content/config/audio.json'),
		readText('src/interface-system/components/brand-mark.tsx'),
	]);

	assert.equal(packageManifest.version, '1.9.0');
	assert.equal(corpus.contentVersion, '1.10.0');
	const about = pages.find((entry) => entry.id === 'page.about');
	assert.equal(about.revision, 4);
	assert.equal(about.aboutStory.lifecycle.steps.length, 4);
	assert.equal(about.aboutStory.sections.length, 7);
	assert.deepEqual(
		about.aboutStory.sections
			.filter((entry) => entry.status === 'placeholder')
			.map((entry) => [entry.id, entry.entries.length]),
		[
			['projects', 0],
			['testimonials', 0],
		],
	);
	assert.equal(audio.tracks[0].delivery, 'same-origin');
	assert.deepEqual(audio.tracks[0].sources, [
		{ src: '/audio/iron-creed-anthem.m4a', type: 'audio/mp4' },
	]);
	assert.match(brand, /data-brand-state="ic-faceted-monogram-2026"/);
	await access(path.join(projectRoot, 'public/audio/iron-creed-anthem.m4a'));
});

test('ICW-HIST-0040: VOX publishes a full public WARDEN and two pinned policy gitlinks', async () => {
	const [policy, gitmodules, publicPackageBuilder, runner, acts] = await Promise.all([
		readJson('vox/publication-policy.json'),
		readText('vox/public-source/.gitmodules'),
		readText('scripts/vox/lib.mjs'),
		readText('constitutional-guard/run.mjs'),
		readJson('governance/acts.json'),
	]);

	assert.equal(policy.revision, '2.3.0');
	assert.deepEqual(policy.gitlinks, [
		{
			path: 'code-constitution',
			repository: 'https://github.com/FOP-Oksana-Dubinetska/code-constitution.git',
			commit: '6bdb3f85236a45254724e7dabee840b2c573f5da',
		},
		{
			path: 'repository-licensing-policy',
			repository: 'https://github.com/FOP-Oksana-Dubinetska/repository-licensing-policy.git',
			commit: '6e4c2627717c079827ed4aa9044a5346b3ea3ddb',
		},
	]);
	assert.match(gitmodules, /\[submodule "repository-licensing-policy"\]/);
	assert.match(publicPackageBuilder, /'guard:prebuild'/);
	assert.match(publicPackageBuilder, /'guard:postbuild'/);
	assert.match(runner, /VOX-PUBLICATION\.json/);
	assert.match(runner, /tests', 'public'/);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-vox-public-source-001')?.revision,
		'2.3.0',
	);
	await access(
		path.join(projectRoot, 'constitutional-guard/tests/public/prebuild/current-public.test.mjs'),
	);
	await access(
		path.join(projectRoot, 'constitutional-guard/tests/public/postbuild/current-public.test.mjs'),
	);
});
