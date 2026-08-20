import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0024: public projections contain only accepted public records', async () => {
	const [siteManifest, gptManifest, materials, entities, urls, assets, pkg] = await Promise.all([
		readJson('semantic-core/dist/site/manifest.json'),
		readJson('semantic-core/dist/custom-gpt/manifest.json'),
		readJson('semantic-core/dist/site/materials.json'),
		readJson('semantic-core/dist/site/entities.json'),
		readJson('semantic-core/dist/site/url-map.json'),
		readJson('semantic-core/corpus/assets/registry.json'),
		readJson('package.json'),
	]);

	assert.equal(pkg.version, '0.11.0');
	assert.equal(siteManifest.contentVersion, '1.2.0');
	assert.equal(siteManifest.sourceCommit, gptManifest.sourceCommit);
	assert.equal(siteManifest.contentDigest, gptManifest.contentDigest);
	assert.equal(materials.length, 4);
	assert.equal(urls.length, 4);
	assert.equal(entities.filter((entry) => entry.locale === 'uk').length, 110);
	assert.equal(entities.filter((entry) => entry.locale === 'en').length, 110);
	assert.ok(materials.every((material) => material.status === 'published'));
	assert.ok(entities.every((entity) => entity.status === 'published'));
	assert.ok(assets.every((asset) => asset.status === 'published' && asset.revision === 2));
});

test('ICW-HIST-0024: lifecycle law separates editorial work from generated release work', async () => {
	const [acts, development, lifecycle, semanticAct, template, prompts, build, corpusLibrary] =
		await Promise.all([
			readJson('governance/acts.json'),
			readText('governance/legislation/DEVELOPMENT.md'),
			readText('governance/legislation/CONTENT_LIFECYCLE_2026-08-11.md'),
			readText('governance/legislation/SEMANTIC_CORE_AND_ENTITY_INDEX_2026-08-11.md'),
			readText('semantic-core/docs/article-publication-template-v4.txt'),
			readText('governance/prompts/README.md'),
			readText('semantic-core/tooling/build/index.mjs'),
			readText('semantic-core/tooling/lib/corpus.mjs'),
		]);

	assert.ok(
		acts.acts.some(
			(entry) => entry.id === 'icw-act-content-lifecycle-001' && entry.status === 'active',
		),
	);
	assert.match(development, /`draft`, `review`, `published` либо `deprecated`/);
	assert.match(lifecycle, /ICW-CL03\. Добавление материала/);
	assert.match(lifecycle, /ICW-CL06\. Матрица версий/);
	assert.match(lifecycle, /ICW-CL07\. Пересборка и публичный индекс/);
	assert.match(semanticAct, /ICW-SC11/);
	assert.match(template, /Редакция: 4\.1\.0/);
	assert.match(prompts, /MATERIAL_ADD\.md/);
	assert.match(prompts, /RELEASE_AND_MIRROR\.md/);
	assert.match(build, /buildPublicEntityIndex/);
	assert.match(corpusLibrary, /record\.status === 'published'/);
});
