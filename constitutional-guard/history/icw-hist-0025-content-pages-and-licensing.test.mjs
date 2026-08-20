import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0025: release 0.12.0 seals public pages, authors, DOI, and licensing', async () => {
	const [pkg, siteManifest, gptManifest, pages, questions, views, entities, urls, materials] =
		await Promise.all([
			readJson('package.json'),
			readJson('semantic-core/dist/site/manifest.json'),
			readJson('semantic-core/dist/custom-gpt/manifest.json'),
			readJson('semantic-core/dist/site/pages.json'),
			readJson('semantic-core/corpus/questions/registry.json'),
			readJson('semantic-core/corpus/views/registry.json'),
			readJson('semantic-core/dist/site/entities.json'),
			readJson('semantic-core/dist/site/url-map.json'),
			readJson('semantic-core/dist/site/materials.json'),
		]);

	assert.equal(pkg.version, '0.12.0');
	assert.equal(siteManifest.contentVersion, '1.3.0');
	assert.equal(siteManifest.sourceCommit, gptManifest.sourceCommit);
	assert.equal(siteManifest.contentDigest, gptManifest.contentDigest);
	assert.equal(pages.length, 12);
	assert.equal(questions.length, 79);
	assert.equal(views.length, 3);
	assert.equal(urls.length, 16);
	assert.equal(entities.filter((entry) => entry.locale === 'uk').length, 118);
	assert.equal(entities.filter((entry) => entry.locale === 'en').length, 118);
	assert.deepEqual(
		new Set(entities.map((entry) => entry.kind)),
		new Set(['page', 'material', 'question', 'concept', 'claim', 'source', 'protocol', 'asset']),
	);
	assert.ok(pages.every((page) => page.status === 'published'));

	for (const article of materials) {
		assert.equal(
			article.publication.doi,
			article.materialId === 'material.from-body-to-signal'
				? '10.5281/zenodo.19773963'
				: '10.5281/zenodo.20608558',
		);
		assert.deepEqual(
			article.authorMetadata.map((author) => author.url),
			['https://orcid.org/0009-0009-2621-6372', 'https://orcid.org/0009-0003-8777-8412'],
		);
	}
});

test('ICW-HIST-0025: the governed architecture uses a page index and safe public projections', async () => {
	const [profile, development, experience, semanticAct, lifecycle, navigation, css, licence] =
		await Promise.all([
			readText('governance/PROFILE.md'),
			readText('governance/legislation/DEVELOPMENT.md'),
			readText('governance/legislation/SITE_EXPERIENCE.md'),
			readText('governance/legislation/SEMANTIC_CORE_AND_ENTITY_INDEX_2026-08-11.md'),
			readText('governance/legislation/CONTENT_LIFECYCLE_2026-08-11.md'),
			readText('src/interface-system/components/site-navigation.tsx'),
			readText('src/interface-system/iron-creed-interface.css'),
			readText('LICENSE.md'),
		]);

	assert.match(profile, /Редакция: `0\.5\.0`/);
	assert.match(development, /Редакция: `0\.12\.0`/);
	assert.match(experience, /Редакция: `0\.11\.0`/);
	assert.match(semanticAct, /Редакция: `1\.2\.0`/);
	assert.match(lifecycle, /Редакция: `1\.1\.0`/);
	assert.match(profile, /CC BY-SA 4\.0/);
	assert.match(licence, /MIT License/);
	assert.match(licence, /No licence granted; all rights reserved/);
	assert.match(navigation, /https:\/\/github\.com\/IRONCREED\/VOX/);
	assert.match(navigation, /build-identity__policies/);
	assert.doesNotMatch(navigation, /EntityIndexTree/);
	assert.doesNotMatch(css, /\.interface-shell::after/);
	await assert.rejects(access(path.join(projectRoot, 'app/sitemap.ts')));
});
