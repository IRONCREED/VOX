import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0036: release 1.6.0 seals question discovery without inventing an AI-authority material', async () => {
	const [pkg, corpus, materials, questions, entities, acts, policy] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('semantic-core/dist/site/materials.json'),
		readJson('semantic-core/corpus/questions/registry.json'),
		readJson('semantic-core/dist/site/entities.json'),
		readJson('governance/acts.json'),
		readJson('vox/publication-policy.json'),
	]);

	assert.equal(pkg.version, '1.6.0');
	assert.equal(corpus.contentVersion, '1.7.0');
	assert.equal(materials.length, 22);
	assert.equal(new Set(materials.map((entry) => entry.materialId)).size, 11);
	assert.equal(
		materials.some((entry) => /ai[- ]authority/i.test(entry.materialId)),
		false,
	);
	assert.equal(questions.length, 455);
	assert.ok(questions.some((entry) => entry.id === 'q.documentation.ai-authority'));
	assert.equal(entities.filter((entry) => entry.locale === 'en').length, 566);
	assert.equal(entities.filter((entry) => entry.locale === 'uk').length, 566);
	assert.ok(
		entities
			.filter((entry) => entry.kind === 'question')
			.every((entry) => entry.href === `/${entry.locale}/questions/${entry.id}`),
	);
	assert.ok(
		entities
			.filter((entry) => entry.kind !== 'question')
			.every((entry) => !entry.href?.includes('/questions/')),
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-development-001')?.revision,
		'1.4.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-site-experience-001')?.revision,
		'1.5.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-semantic-core-001')?.revision,
		'1.6.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-content-lifecycle-001')?.revision,
		'2.2.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-vox-public-source-001')?.revision,
		'2.1.0',
	);
	assert.equal(policy.revision, '2.1.0');
});

test('ICW-HIST-0036: localized maps, question routes, prompts, and optical brand fixes are canonical source', async () => {
	const [
		pkg,
		sitemapScript,
		route,
		repository,
		toggle,
		css,
		geometry,
		faviconRenderer,
		prompt,
		voxDoc,
	] = await Promise.all([
		readJson('package.json'),
		readText('scripts/sitemaps.mjs'),
		readText('app/[locale]/questions/[questionId]/page.tsx'),
		readText('src/content-catalog/adapters/corpus-content-repository.ts'),
		readText('src/interface-system/components/sidebar-toggle.tsx'),
		readText('src/interface-system/iron-creed-interface.css'),
		readJson('src/interface-system/brand/iron-creed-mark.json'),
		readText('scripts/render-brand-asset.mjs'),
		readText('governance/prompts/SITEMAP_UPDATE.md'),
		readText('vox/public-docs/QUESTION-DISCOVERY.md'),
	]);

	assert.equal(pkg.scripts['sitemaps:build'], 'node scripts/sitemaps.mjs --write');
	assert.equal(pkg.scripts['sitemaps:check'], 'node scripts/sitemaps.mjs --check');
	assert.match(sitemapScript, /supportedLocales = \['uk', 'en'\]/);
	assert.match(sitemapScript, /questions\.xml/);
	assert.match(sitemapScript, /Question .* has no public material or page association/);
	assert.match(route, /'@type': 'QAPage'/);
	assert.match(route, /selectedEntityId=\{question\.id\}/);
	assert.match(repository, /relatedEntries/);
	assert.doesNotMatch(toggle, /<i\s*\/>/);
	assert.match(css, /\.brand-mark--header\s*\{[\s\S]*?clamp\(42px, 3\.6vw, 52px\)/);
	assert.match(css, /backface-visibility: hidden/);
	assert.match(css, /translate\(14px, 14px\)[\s\S]*?scale\(0\.95\)/);
	assert.equal(geometry.viewBox, '25 0 78 158');
	assert.match(faviconRenderer, /iron-creed-favicon__plate/);
	assert.match(prompt, /sitemaps:check/);
	assert.match(prompt, /RELEASE_AND_MIRROR\.md/);
	assert.match(voxDoc, /future of search/i);
});
