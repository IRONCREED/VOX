import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0029: release 1.1.0 establishes one governed seven-part material series', async () => {
	const [pkg, corpus, categories, materials, series, questions, views, entities, acts] =
		await Promise.all([
			readJson('package.json'),
			readJson('semantic-core/corpus.yaml'),
			readJson('content/config/categories.json'),
			readJson('semantic-core/dist/site/materials.json'),
			readJson('semantic-core/dist/site/series.json'),
			readJson('semantic-core/corpus/questions/registry.json'),
			readJson('semantic-core/corpus/views/registry.json'),
			readJson('semantic-core/dist/site/entities.json'),
			readJson('governance/acts.json'),
		]);

	assert.equal(pkg.version, '1.1.0');
	assert.equal(corpus.contentVersion, '1.4.0');
	assert.deepEqual(
		categories.map((category) => category.id),
		['programming', 'research', 'scenarios'],
	);
	assert.equal(materials.length, 18);
	assert.equal(series.length, 2);
	assert.ok(series.every((entry) => entry.materialIds.length === 7));
	assert.ok(series.every((entry) => entry.folderSheets === 2));
	assert.equal(questions.length, 447);
	assert.equal(views.length, 10);
	assert.equal(entities.filter((entry) => entry.locale === 'en').length, 545);
	assert.equal(entities.filter((entry) => entry.locale === 'uk').length, 545);
	assert.equal(acts.acts.find((act) => act.id === 'icw-act-development-001')?.revision, '1.1.0');
	assert.equal(
		acts.acts.find((act) => act.id === 'icw-act-site-experience-001')?.revision,
		'1.1.0',
	);
	assert.equal(
		acts.acts.find((act) => act.id === 'icw-act-content-foundation-001')?.revision,
		'2.1.0',
	);
	assert.equal(acts.acts.find((act) => act.id === 'icw-act-semantic-core-001')?.revision, '1.3.0');
	assert.equal(
		acts.acts.find((act) => act.id === 'icw-act-content-lifecycle-001')?.revision,
		'1.2.0',
	);
});

test('ICW-HIST-0029: each series part owns a unique position and remains absent as a catalog row', async () => {
	const [canonicalSeries, materials, repository, audit] = await Promise.all([
		readJson('semantic-core/corpus/series/registry.json'),
		readJson('semantic-core/dist/site/materials.json'),
		readText('src/content-catalog/adapters/corpus-content-repository.ts'),
		readJson('semantic-core/docs/question-audit-2026-08-14-constitution-runtime.json'),
	]);

	assert.equal(canonicalSeries.length, 1);
	const [entry] = canonicalSeries;
	assert.equal(entry.id, 'series.constitution-runtime');
	assert.equal(entry.materialIds.length, 7);
	for (const locale of ['uk', 'en']) {
		const parts = materials.filter(
			(material) => material.locale === locale && material.series?.seriesId === entry.id,
		);
		assert.deepEqual(
			parts.map((material) => material.series.position).toSorted((left, right) => left - right),
			[1, 2, 3, 4, 5, 6, 7],
		);
	}
	assert.match(repository, /getPublishedCatalogEntries/);
	assert.match(repository, /groupedMaterialIds/);
	assert.match(repository, /getPublishedSeries/);
	assert.equal(audit.results.exactMatchesAgainstExisting, 0);
	assert.equal(audit.results.lexicalMatchesAtOrAbove042AgainstExisting, 0);
	assert.equal(audit.editorialDecision.forcedReuse, false);
	assert.match(audit.editorialDecision.literateProgramming, /source-level related_to edge only/);
});

test('ICW-HIST-0029: the release records constitutional review and hashed evidence', async () => {
	const attestation = await readJson('governance/attestations/material-series-2026-08-14.json');

	assert.equal(attestation.constitutionImpact.status, 'reviewed-no-change');
	assert.equal(attestation.profileImpact.status, 'reviewed-no-change');
	assert.equal(attestation.contentImpact.contentVersion, '1.4.0');
	assert.equal(attestation.release.siteVersion, '1.1.0');

	for (const document of attestation.documents) {
		const content = await readFile(path.join(projectRoot, document.path));
		assert.equal(createHash('sha256').update(content).digest('hex'), document.sha256);
	}
});
