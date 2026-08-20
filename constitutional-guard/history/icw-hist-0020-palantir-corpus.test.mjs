import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0020: PALANTIR remains the canonical bilingual publication corpus', async () => {
	const [siteManifest, gptManifest, materials, questions, views, protocols, prisms, acts, pkg] =
		await Promise.all([
			readJson('palantir/dist/site/manifest.json'),
			readJson('palantir/dist/custom-gpt/manifest.json'),
			readJson('palantir/dist/site/materials.json'),
			readJson('palantir/corpus/questions/registry.json'),
			readJson('palantir/corpus/views/registry.json'),
			readJson('palantir/corpus/protocols/registry.json'),
			readJson('palantir/corpus/prisms/registry.json'),
			readJson('governance/acts.json'),
			readJson('package.json'),
		]);

	assert.equal(siteManifest.sourceCommit, gptManifest.sourceCommit);
	assert.equal(siteManifest.contentVersion, gptManifest.contentVersion);
	assert.equal(siteManifest.contentDigest, gptManifest.contentDigest);
	assert.equal(materials.length, 4);
	assert.deepEqual(new Set(materials.map((item) => item.locale)), new Set(['uk', 'en']));
	assert.deepEqual(
		new Set(materials.map((item) => item.materialId)),
		new Set(['material.from-body-to-signal', 'material.why-documentation']),
	);
	assert.equal(questions.length, 77);
	assert.equal(views.length, 2);
	assert.equal(prisms.length, 3);
	assert.equal(
		protocols.find((item) => item.id === 'protocol.infection-case-card').fields.length,
		6,
	);
	for (const question of questions) {
		assert.ok(question.answerContract?.shape);
		for (const field of ['parentId', 'children', 'depth', 'materialId']) {
			assert.equal(question[field], undefined);
		}
	}
	assert.equal(pkg.version, '0.9.0');
	assert.ok(acts.acts.some((entry) => entry.id === 'icw-act-palantir-corpus-001'));

	for (const removed of [
		'content/config/companion.json',
		'content/config/tags.json',
		'content/uk/research/vid-tila-do-syhnalu.md',
		'content/en/programming/why-documentation-matters.md',
	]) {
		await assert.rejects(access(path.join(projectRoot, removed)));
	}
});

test('ICW-HIST-0020: integration is explicit, deterministic, and drift-blocking', async () => {
	const [scan, apply, build, adapter, buildScript, template] = await Promise.all([
		readText('palantir/tooling/scan/index.mjs'),
		readText('palantir/tooling/apply/index.mjs'),
		readText('palantir/tooling/build/index.mjs'),
		readText('src/content-catalog/adapters/palantir-content-repository.ts'),
		readText('scripts/build-verified.sh'),
		readText('palantir/docs/article-publication-template-v3.txt'),
	]);
	assert.doesNotMatch(scan, /git commit|git push/);
	assert.match(apply, /explicit --apply flag/);
	assert.match(apply, /scanMaterial/);
	assert.match(build, /Derived projection drift/);
	assert.match(adapter, /palantir\/dist\/site/);
	assert.match(buildScript, /run build:check/);
	assert.match(template, /scan.*apply.*validate.*build/s);
});
