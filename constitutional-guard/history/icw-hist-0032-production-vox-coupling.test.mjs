import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0032: release 1.3.0 couples every production deployment to VOX', async () => {
	const [pkg, corpus, acts, pages, lifecycle, voxAct, siteExperience] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('governance/acts.json'),
		readJson('semantic-core/corpus/pages/registry.json'),
		readText('governance/legislation/CONTENT_LIFECYCLE_2026-08-11.md'),
		readText('governance/legislation/VOX_PUBLIC_SOURCE_2026-08-14.md'),
		readText('governance/legislation/SITE_EXPERIENCE.md'),
	]);

	assert.equal(pkg.version, '1.3.0');
	assert.equal(corpus.contentVersion, '1.5.0');
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-site-experience-001')?.revision,
		'1.2.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-semantic-core-001')?.revision,
		'1.5.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-content-lifecycle-001')?.revision,
		'2.1.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-vox-public-source-001')?.revision,
		'1.1.0',
	);
	assert.match(lifecycle, /Каждый новый production/);
	assert.match(voxAct, /Каждый новый production/);
	assert.match(siteExperience, /JavaScript-улучшением/);

	const licensing = pages.find((page) => page.id === 'page.licensing');
	assert.equal(licensing.revision, 2);
	assert.match(licensing.body.uk.join('\n'), /Кожне production-розгортання/);
	assert.match(licensing.body.en.join('\n'), /Every production deployment/);
	assert.match(licensing.body.en.join('\n'), /VOX-PUBLICATION\.json/);
});

test('ICW-HIST-0032: VOX remains a strict public projection', async () => {
	const [policy, prepare, verify, publish] = await Promise.all([
		readJson('vox/publication-policy.json'),
		readText('scripts/vox/prepare.mjs'),
		readText('scripts/vox/verify.mjs'),
		readText('scripts/vox/publish.mjs'),
	]);

	assert.deepEqual(policy.destination, {
		owner: 'IRONCREED',
		repository: 'VOX',
		branch: 'main',
	});
	assert.equal(policy.revision, '1.1.0');
	for (const prefix of [
		'governance/',
		'constitutional-guard/',
		'semantic-core/corpus/',
		'semantic-core/materials/',
		'semantic-core/dist/custom-gpt/',
		'scripts/vox/',
	]) {
		assert.ok(policy.forbiddenDestinationPrefixes.includes(prefix), prefix);
	}
	assert.match(prepare, /work\/vox-export/);
	assert.match(verify, /Public documentation must be English-only/);
	assert.match(verify, /Secret-shaped content/);
	assert.match(publish, /force: false/);
});
