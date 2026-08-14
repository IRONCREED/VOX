import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the public source uses the released locale and projection contracts', async () => {
	const [domainModel, repository, siteManifest] = await Promise.all([
		readFile('src/content-catalog/domain/content-model.ts', 'utf8'),
		readFile('src/content-catalog/adapters/corpus-content-repository.ts', 'utf8'),
		readFile('semantic-core/dist/site/manifest.json', 'utf8').then(JSON.parse),
	]);

	assert.match(domainModel, /SUPPORTED_LOCALES = \[['"]uk['"], ['"]en['"]\]/);
	assert.match(repository, /semantic-core\/dist\/site\/materials\.json/);
	assert.equal(siteManifest.target, 'site');
	assert.match(siteManifest.contentDigest, /^[0-9a-f]{64}$/);
});

test('the public repository excludes private project classes', async () => {
	const publication = JSON.parse(await readFile('VOX-PUBLICATION.json', 'utf8'));
	const paths = publication.files.map((entry) => entry.path);

	for (const prefix of [
		'governance/',
		'constitutional-guard/',
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
});
