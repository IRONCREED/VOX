import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the public source uses the released locale and projection contracts', async () => {
	const [domainModel, repository, siteManifest, sitemapScript] = await Promise.all([
		readFile('src/content-catalog/domain/content-model.ts', 'utf8'),
		readFile('src/content-catalog/adapters/corpus-content-repository.ts', 'utf8'),
		readFile('semantic-core/dist/site/manifest.json', 'utf8').then(JSON.parse),
		readFile('scripts/sitemaps.mjs', 'utf8'),
	]);

	assert.match(domainModel, /SUPPORTED_LOCALES = \[['"]uk['"], ['"]en['"]\]/);
	assert.match(repository, /semantic-core\/dist\/site\/materials\.json/);
	assert.equal(siteManifest.target, 'site');
	assert.match(siteManifest.contentDigest, /^[0-9a-f]{64}$/);
	assert.match(repository, /getQuestionHref/);
	assert.match(sitemapScript, /questions\.xml/);
});

test('the public repository exposes governance enforcement but excludes private editorial classes', async () => {
	const publication = JSON.parse(await readFile('VOX-PUBLICATION.json', 'utf8'));
	const paths = publication.files.map((entry) => entry.path);

	for (const prefix of [
		'governance/attestations/',
		'governance/prompts/',
		'governance/reports/',
		'semantic-core/corpus/',
		'semantic-core/materials/',
		'semantic-core/dist/custom-gpt/',
	]) {
		assert.equal(
			paths.some((entry) => entry.startsWith(prefix)),
			false,
			prefix,
		);
	}

	assert.ok(paths.includes('CONSTITUTION.md'));
	assert.ok(paths.includes('governance/PROFILE.md'));
	assert.ok(paths.includes('governance/acts.json'));
	assert.ok(paths.includes('constitutional-guard/run.mjs'));
	assert.ok(paths.includes('scripts/sitemaps.mjs'));
	assert.ok(paths.includes('public/sitemap.xml'));
	assert.ok(paths.includes('public/sitemaps/uk/questions.xml'));
	assert.ok(paths.includes('public/sitemaps/en/questions.xml'));
	assert.deepEqual(publication.gitlinks, [
		{
			path: 'code-constitution',
			repository: 'https://github.com/FOP-Oksana-Dubinetska/code-constitution.git',
			commit: '6bdb3f85236a45254724e7dabee840b2c573f5da',
		},
	]);
});
