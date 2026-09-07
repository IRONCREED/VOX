import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0046: release 1.12.0 publishes the bilingual About portfolio and identity concept', async () => {
	const [packageManifest, corpus, pages, concepts, assets] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('semantic-core/corpus/pages/registry.json'),
		readJson('semantic-core/corpus/concepts/registry.json'),
		readJson('semantic-core/corpus/assets/registry.json'),
	]);

	assert.equal(packageManifest.version, '1.12.0');
	assert.equal(corpus.contentVersion, '1.13.0');
	assert.equal(assets.length, 57);
	assert.ok(assets.every((asset) => asset.assetType === 'diagram'));

	const about = pages.find((entry) => entry.id === 'page.about');
	assert.equal(about.revision, 5);
	assert.deepEqual(about.conceptIds, ['concept.iron-creed']);
	assert.equal(about.aboutStory.sections.length, 8);
	assert.deepEqual(
		about.aboutStory.sections
			.filter((entry) => entry.status === 'placeholder')
			.map((entry) => entry.id),
		['testimonials'],
	);
	assert.equal(
		about.aboutStory.sections.find((entry) => entry.id === 'projects').entries.length,
		5,
	);
	assert.equal(about.aboutStory.sections.find((entry) => entry.id === 'people').entries.length, 2);
	const contact = about.aboutStory.sections.find((entry) => entry.id === 'contact');
	assert.equal(contact.fields, undefined);
	assert.equal(contact.link.href.en, 'https://www.linkedin.com/company/IRONCREED');

	const ironCreed = concepts.find((entry) => entry.id === 'concept.iron-creed');
	assert.equal(ironCreed.status, 'published');
	assert.equal(ironCreed.visibility, 'public');
	assert.match(ironCreed.definition.en, /personified engineering process/);
});

test('ICW-HIST-0046: the About identity uses the shared hint and inherited interface tokens', async () => {
	const [template, hint, story, styles] = await Promise.all([
		readText('src/interface-system/templates/content-page-template.tsx'),
		readText('src/interface-system/components/contextual-hint.tsx'),
		readText('src/interface-system/components/about-story.tsx'),
		readText('src/interface-system/iron-creed-interface.css'),
	]);

	assert.match(template, /<ContextualHint/);
	assert.match(template, /about-iron-creed-identity/);
	assert.match(hint, /aria-expanded/);
	assert.match(hint, /closeOnEscape/);
	assert.match(story, /about-cycle__conclusion/);
	assert.match(story, /about-service__entries/);
	assert.match(styles, /\.about-identity-hint/);
	assert.match(styles, /\.about-service__entries/);
	assert.match(styles, /var\(--cyan\)/);
	assert.match(styles, /var\(--line-soft\)/);
});
