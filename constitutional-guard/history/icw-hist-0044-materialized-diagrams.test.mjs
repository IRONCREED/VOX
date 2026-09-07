import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('every indexed graphic assignment is a canonical bilingual diagram projection', async () => {
	const [packageManifest, corpus, assets, articleBody, matrixRenderer, figure] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('semantic-core/corpus/assets/registry.json'),
		readText('src/interface-system/components/article-body.tsx'),
		readText('src/diagram-system/components/matrix-diagram.tsx'),
		readText('src/diagram-system/components/diagram-figure.tsx'),
	]);

	assert.equal(packageManifest.version, '1.11.0');
	assert.equal(corpus.contentVersion, '1.12.0');
	assert.equal(assets.length, 57);
	assert.ok(assets.every((asset) => asset.assetType === 'diagram'));
	assert.ok(assets.every((asset) => asset.status === 'published'));
	assert.ok(assets.every((asset) => asset.visibility === 'public'));
	assert.ok(assets.every((asset) => asset.diagram.representations.includes('publication')));
	assert.ok(
		assets.every((asset) =>
			['alt', 'title', 'caption'].every(
				(field) => asset.publication[field].uk && asset.publication[field].en,
			),
		),
	);
	assert.ok(assets.every((asset) => asset.publication.provenance));
	assert.equal(
		assets.reduce((count, asset) => count + asset.diagram.nodes.length, 0),
		392,
	);
	assert.equal(
		assets.reduce((count, asset) => count + asset.diagram.relations.length, 0),
		384,
	);
	assert.doesNotMatch(JSON.stringify(assets), /"(?:x|y|position|coordinates)":/);

	const constitutionAssets = assets.filter((asset) =>
		asset.id.startsWith('asset.constitution-runtime-'),
	);
	assert.equal(constitutionAssets.length, 47);
	assert.ok(
		constitutionAssets.every((asset) => asset.diagram.source === 'series.constitution-runtime'),
	);

	const matrix = assets.find((asset) => asset.id === 'asset.constitution-runtime-07-article-i.g06');
	assert.equal(matrix.diagram.renderer, 'matrix');
	assert.equal(matrix.diagram.nodes.filter((node) => node.role === 'source').length, 4);
	assert.equal(matrix.diagram.nodes.filter((node) => node.role !== 'source').length, 9);
	assert.equal(matrix.diagram.relations.length, 36);
	assert.match(matrixRenderer, /role="columnheader"/);
	assert.match(matrixRenderer, /role="rowheader"/);
	assert.match(matrixRenderer, /role="cell"/);
	assert.match(figure, /ic-diagram-transcript/);
	for (const marker of ['Графічний слот', 'Graphic slot', 'Visual slot', 'Схема', 'Diagram']) {
		assert.match(articleBody, new RegExp(marker));
	}
});

test('the LA-1 slot truthfully identifies its generated source portrait', async () => {
	const assets = await readJson('semantic-core/corpus/assets/registry.json');
	const la1 = assets.find((asset) => asset.id === 'asset.why-documentation.g01');
	assert.equal(la1.diagram.source, 'view.programming.why-documentation');
	assert.match(la1.publication.alt.en, /^A diagram presents LA-1/);
	assert.doesNotMatch(la1.publication.alt.en, /first page/i);
});
