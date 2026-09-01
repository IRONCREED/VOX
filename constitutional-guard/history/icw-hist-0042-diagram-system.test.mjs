import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('the diagram system remains a canonical projection rather than a drawing store', async () => {
	const [packageManifest, corpus, assets, siteAssets, schema, act, docs, articleBody] =
		await Promise.all([
			readJson('package.json'),
			readJson('semantic-core/corpus.yaml'),
			readJson('semantic-core/corpus/assets/registry.json'),
			readJson('semantic-core/dist/site/assets.json'),
			readJson('semantic-core/schemas/diagram.schema.json'),
			readText('governance/legislation/DIAGRAM_SYSTEM_2026-09-01.md'),
			readText('semantic-core/docs/diagram-system.md'),
			readText('src/interface-system/components/article-body.tsx'),
		]);

	assert.equal(packageManifest.version, '1.10.0');
	assert.equal(corpus.contentVersion, '1.11.0');
	assert.equal(packageManifest.dependencies['@xyflow/react'], '12.11.6');
	assert.equal(packageManifest.dependencies.elkjs, '0.12.0');
	assert.equal(packageManifest.devDependencies['@playwright/test'], '1.62.1');
	assert.equal(assets.length, 57);
	assert.equal(assets.filter((asset) => asset.assetType === 'editorial-request').length, 57);
	assert.equal(assets.filter((asset) => asset.assetType === 'diagram').length, 0);
	assert.equal(siteAssets.length, 114);
	assert.ok(siteAssets.every((asset) => asset.assetType === 'editorial-request'));
	assert.deepEqual(schema.required, [
		'source',
		'projection',
		'renderer',
		'preset',
		'representations',
		'nodes',
		'relations',
	]);
	assert.match(act, /Entity → Relation → Projection → Layout → Renderer/);
	assert.match(docs, /semantic-core → projection → layout → renderer → publication/);
	assert.match(articleBody, /DiagramAssetSlot/);
});

test('the public boundary carries runtime, schema and reproducible export without corpus source', async () => {
	const [policy, voxLibrary] = await Promise.all([
		readJson('vox/publication-policy.json'),
		readText('scripts/vox/lib.mjs'),
	]);
	assert.equal(policy.revision, '2.4.0');
	for (const destination of [
		'docs/DIAGRAM-SYSTEM.md',
		'semantic-core/schemas/diagram.schema.json',
		'playwright.diagram.config.ts',
		'tests/diagrams/publication-export.spec.ts',
	]) {
		assert.ok(policy.files.some((entry) => entry.destination === destination));
	}
	assert.match(voxLibrary, /diagram:export/);
	assert.ok(policy.forbiddenSourcePrefixes.includes('semantic-core/corpus/'));
});
