import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0022: the semantic core preserves standalone questions and synchronized projections', async () => {
	const [siteManifest, gptManifest, materials, entities, questions, views, acts, pkg] =
		await Promise.all([
			readJson('semantic-core/dist/site/manifest.json'),
			readJson('semantic-core/dist/custom-gpt/manifest.json'),
			readJson('semantic-core/dist/site/materials.json'),
			readJson('semantic-core/dist/site/entities.json'),
			readJson('semantic-core/corpus/questions/registry.json'),
			readJson('semantic-core/corpus/views/registry.json'),
			readJson('governance/acts.json'),
			readJson('package.json'),
		]);

	assert.equal(siteManifest.sourceCommit, gptManifest.sourceCommit);
	assert.equal(siteManifest.contentVersion, '1.1.0');
	assert.equal(siteManifest.contentDigest, gptManifest.contentDigest);
	assert.equal(materials.length, 4);
	assert.deepEqual(new Set(materials.map((item) => item.locale)), new Set(['uk', 'en']));
	assert.equal(questions.length, 77);
	assert.ok(questions.every((question) => question.standalone === true));
	assert.equal(views.length, 2);
	assert.equal(entities.filter((entry) => entry.locale === 'uk').length, 110);
	assert.equal(entities.filter((entry) => entry.locale === 'en').length, 110);
	assert.equal(
		entities.some((entry) => entry.kind === 'note'),
		false,
	);
	assert.equal(pkg.version, '0.10.0');
	assert.ok(
		acts.acts.some(
			(entry) => entry.id === 'icw-act-semantic-core-001' && entry.status === 'active',
		),
	);

	for (const question of questions) {
		for (const field of ['parentId', 'children', 'depth', 'materialId']) {
			assert.equal(question[field], undefined);
		}
	}
});

test('ICW-HIST-0022: current integration has an index and no retired reading-mode artifacts', async () => {
	const [adapter, build, template, audit] = await Promise.all([
		readText('src/content-catalog/adapters/corpus-content-repository.ts'),
		readText('semantic-core/tooling/build/index.mjs'),
		readText('semantic-core/docs/article-publication-template-v4.txt'),
		readText('semantic-core/docs/question-audit-2026-08-11.md'),
	]);
	assert.match(adapter, /semantic-core\/dist\/site\/entities\.json/);
	assert.match(build, /buildPublicEntityIndex/);
	assert.match(template, /standalone: true/);
	assert.match(audit, /77 из 77/);

	const retiredDirectory = ['pri', 'sms'].join('');
	const retiredComponent = ['pri', 'sm-control.tsx'].join('');
	await assert.rejects(access(path.join(projectRoot, 'semantic-core/corpus', retiredDirectory)));
	await assert.rejects(
		access(path.join(projectRoot, 'src/interface-system/components', retiredComponent)),
	);
});
