import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('the public WARDEN receives a sealed and allowlisted release', async () => {
	assert.equal(process.env.IRON_WARDEN_SURFACE, 'public');
	const [publication, policy, packageManifest, siteManifest] = await Promise.all([
		readJson('VOX-PUBLICATION.json'),
		readJson('publication-policy.json'),
		readJson('package.json'),
		readJson('semantic-core/dist/site/manifest.json'),
	]);

	assert.equal(publication.managedBy, 'icw-vox-public-source-001');
	assert.equal(publication.worktreeDirty, false);
	assert.equal(publication.policyRevision, policy.revision);
	assert.equal(publication.siteVersion, packageManifest.version);
	assert.equal(publication.contentDigest, siteManifest.contentDigest);
	assert.equal(publication.corpusSourceCommit, siteManifest.sourceCommit);
	assert.deepEqual(
		publication.gitlinks.map((entry) => entry.path),
		['code-constitution', 'repository-licensing-policy'],
	);
	assert.equal(packageManifest.scripts.guard, 'node constitutional-guard/run.mjs all');
	assert.equal(
		packageManifest.scripts['guard:prebuild'],
		'node constitutional-guard/run.mjs prebuild',
	);
	assert.equal(
		packageManifest.scripts['guard:postbuild'],
		'node constitutional-guard/run.mjs postbuild',
	);
});

test('the public player uses one verified same-origin audio asset', async () => {
	const [audio, privacyPages, provider, audioInfo] = await Promise.all([
		readJson('content/config/audio.json'),
		readJson('semantic-core/dist/site/pages.json'),
		readText('src/interface-system/components/site-audio-provider.tsx'),
		stat(path.join(projectRoot, 'public/audio/iron-creed-anthem.m4a')),
	]);

	assert.equal(audio.schemaVersion, 2);
	assert.equal(audio.tracks.length, 1);
	assert.equal(audio.tracks[0].delivery, 'same-origin');
	assert.deepEqual(audio.tracks[0].sources, [
		{ src: '/audio/iron-creed-anthem.m4a', type: 'audio/mp4' },
	]);
	assert.ok(audioInfo.isFile() && audioInfo.size > 1_000_000);
	assert.match(provider, /preload="none"/);
	assert.doesNotMatch(provider, /cdn1\.suno\.ai|autoplay/i);
	const privacy = privacyPages.find((entry) => entry.id === 'page.privacy-policy.en');
	assert.match(privacy.body, /same-origin site asset/);
	assert.doesNotMatch(privacy.body, /requests the audio file directly from Suno/);
});

test('the public release exposes the new brand, services story, and reusable placeholders', async () => {
	const [pages, brand, component] = await Promise.all([
		readJson('semantic-core/dist/site/pages.json'),
		readFile(path.join(projectRoot, 'public/brand/iron-creed-mark.svg')),
		readText('src/interface-system/components/about-story.tsx'),
	]);

	const about = pages.find((entry) => entry.id === 'page.about.en');
	assert.equal(about.aboutStory.sections.length, 7);
	assert.equal(
		about.aboutStory.sections.find((entry) => entry.id === 'projects').status,
		'placeholder',
	);
	assert.deepEqual(
		about.aboutStory.sections.find((entry) => entry.id === 'testimonials').entries,
		[],
	);
	assert.equal(
		about.aboutStory.sections.find((entry) => entry.id === 'warden').link.href,
		'https://github.com/IRONCREED/VOX/tree/main/constitutional-guard',
	);
	assert.ok(brand.byteLength > 100_000);
	assert.match(component, /about-service__entries/);
	await access(path.join(projectRoot, 'public/favicon.svg'));
});

test('private editorial and operational source remains outside VOX', async () => {
	for (const relativePath of [
		'semantic-core/corpus',
		'semantic-core/materials',
		'semantic-core/dist/custom-gpt',
		'governance/prompts',
		'governance/attestations',
	]) {
		await assert.rejects(access(path.join(projectRoot, relativePath)));
	}
});

test('the public diagram runtime is reproducible without exporting editorial source', async () => {
	const [packageManifest, assets, schema, documentation, articleBody] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/dist/site/assets.json'),
		readJson('semantic-core/schemas/diagram.schema.json'),
		readText('docs/DIAGRAM-SYSTEM.md'),
		readText('src/interface-system/components/article-body.tsx'),
	]);
	assert.equal(packageManifest.dependencies['@xyflow/react'], '12.11.6');
	assert.equal(packageManifest.dependencies.elkjs, '0.12.0');
	assert.equal(
		packageManifest.scripts['diagram:export'],
		'playwright test --config=playwright.diagram.config.ts',
	);
	assert.equal(assets.length, 114);
	assert.equal(assets.filter((asset) => asset.assetType === 'diagram').length, 0);
	assert.ok(schema.properties.projection.enum.includes('warden'));
	assert.match(documentation, /canonical record is an `asset\.\*` entity/);
	assert.match(articleBody, /DiagramAssetSlot/);
	await assert.rejects(access(path.join(projectRoot, 'semantic-core/corpus/assets/registry.json')));
});
