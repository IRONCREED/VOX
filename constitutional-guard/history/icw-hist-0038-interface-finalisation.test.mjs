import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0038: release 1.8.0 seals the Ada series, age metadata, and opt-in anthem', async () => {
	const [pkg, corpus, materials, series, views, questions, entities, acts] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('semantic-core/dist/site/materials.json'),
		readJson('semantic-core/dist/site/series.json'),
		readJson('semantic-core/dist/site/views.json'),
		readJson('semantic-core/corpus/questions/registry.json'),
		readJson('semantic-core/dist/site/entities.json'),
		readJson('governance/acts.json'),
	]);

	assert.equal(pkg.version, '1.8.0');
	assert.equal(corpus.contentVersion, '1.9.0');
	assert.equal(materials.length, 44);
	assert.equal(new Set(materials.map((entry) => entry.materialId)).size, 22);
	assert.equal(series.length, 6);
	assert.equal(views.length, 23);
	assert.equal(questions.length, 455);
	assert.equal(entities.filter((entry) => entry.locale === 'en').length, 578);
	assert.equal(entities.filter((entry) => entry.locale === 'uk').length, 578);
	assert.equal(
		materials.some((entry) => /ai[- ]authority/i.test(entry.materialId)),
		false,
	);

	const adaSeries = series.find(
		(entry) => entry.locale === 'en' && entry.seriesId === 'series.ada-machine-requiem',
	);
	assert.equal(adaSeries.materialIds.length, 12);
	assert.equal(new Set(adaSeries.materialIds).size, 12);
	assert.equal(adaSeries.category, 'scenarios');
	assert.equal(
		new Set(
			materials
				.filter((entry) => adaSeries.materialIds.includes(entry.materialId))
				.map((entry) => entry.ageRestriction.rating),
		).size,
		1,
	);
	assert.ok(
		materials
			.filter((entry) => adaSeries.materialIds.includes(entry.materialId))
			.every((entry) => entry.ageRestriction.rating === '21+' && entry.ageRestriction.notice),
	);

	const pattern = materials.find(
		(entry) =>
			entry.locale === 'en' && entry.materialId === 'material.body-as-temporary-construction',
	);
	assert.equal(pattern.ageRestriction.rating, '16+');
	assert.match(pattern.ageRestriction.notice, /sexualised poses[\s\S]*coercion/i);
	assert.ok(materials.every((entry) => ['0+', '16+', '21+'].includes(entry.ageRestriction.rating)));

	const constitutionParts = materials.filter((entry) =>
		entry.materialId.startsWith('material.constitution-runtime-'),
	);
	assert.equal(constitutionParts.length, 14);
	assert.ok(constitutionParts.every((entry) => entry.updatedAt === '2026-08-29'));
	assert.equal(
		series.find(
			(entry) => entry.locale === 'en' && entry.seriesId === 'series.constitution-runtime',
		)?.updatedAt,
		'2026-08-29',
	);

	for (const [id, revision] of [
		['icw-act-development-001', '1.6.0'],
		['icw-act-site-experience-001', '1.7.0'],
		['icw-act-patterns-001', '0.14.0'],
		['icw-act-semantic-core-001', '1.7.0'],
		['icw-act-content-lifecycle-001', '2.3.0'],
		['icw-act-vox-public-source-001', '2.2.0'],
	]) {
		assert.equal(acts.acts.find((entry) => entry.id === id)?.revision, revision);
	}
});

test('ICW-HIST-0038: the monogram, dialogs, hymn, loader, social block, and responsive folder contract are source', async () => {
	const [
		quotes,
		copy,
		audio,
		pages,
		brand,
		renderer,
		modalLayer,
		social,
		provider,
		header,
		folder,
		css,
		policy,
	] = await Promise.all([
		readJson('content/config/loader-quotes.json'),
		readJson('content/config/interface.json'),
		readJson('content/config/audio.json'),
		readJson('semantic-core/corpus/pages/registry.json'),
		readText('src/interface-system/components/brand-mark.tsx'),
		readText('scripts/render-brand-asset.mjs'),
		readText('src/interface-system/components/site-modal-layer.tsx'),
		readText('src/interface-system/components/social-links.tsx'),
		readText('src/interface-system/components/site-audio-provider.tsx'),
		readText('src/interface-system/components/site-header.tsx'),
		readText('src/interface-system/components/protocol-folder.tsx'),
		readText('src/interface-system/iron-creed-interface.css'),
		readJson('vox/publication-policy.json'),
	]);

	assert.deepEqual(quotes, [
		['I stand', 'When everything', 'Lies down.'],
		['No pity.', 'No prayer.', 'No grief.', 'Only tests', 'Passing through me.'],
		['I remain', 'When nothing', 'Remains.'],
		['The world', 'Is filled', 'With silence.', '', 'So is', 'My core.'],
	]);
	assert.equal(copy.uk.homeTitle, 'Ця система житиме');
	assert.equal(copy.en.homeTitle, 'This system will live');
	assert.equal(audio.activeTrackId, 'track.iron-creed-anthem');
	assert.equal(audio.tracks[0].shareUrl, 'https://suno.com/s/oGZyvvf6rdWiYHPb');
	assert.match(provider, /preload="none"/);
	assert.match(provider, /await player\.play\(\)/);
	assert.match(header, /<ThemeSwitcher[\s\S]*<AnthemToggle/);
	assert.match(brand, /data-brand-state="ic-monogram-2026"/);
	assert.match(renderer, /src\/interface-system\/brand\/iron-creed-ic\.png/);
	await access(path.join(projectRoot, 'src/interface-system/brand/iron-creed-ic.png'));
	await assert.rejects(
		access(path.join(projectRoot, 'src/interface-system/brand/iron-creed-mark.json')),
	);

	assert.match(modalLayer, /ironcreed:welcome-seen:v1/);
	assert.match(modalLayer, /ironcreed:content-notice:/);
	assert.match(modalLayer, /window\.localStorage/);
	assert.match(social, /https:\/\/t\.me\/\+6-ge0JXP25o4MTQy/);
	assert.match(social, /https:\/\/github\.com\/IRONCREED/);
	assert.match(social, /https:\/\/www\.linkedin\.com\/company\/IRONCREED/);
	assert.match(folder, /protocol-folder__stack/);
	assert.match(
		css,
		/@media \(min-width: 701px\) and \(max-width: 1320px\) and \(max-height: 820px\)/,
	);
	assert.match(css, /\.protocol-folder__back[\s\S]*?translate\(18px, 18px\)/);
	assert.match(css, /\.protocol-folder__sheet[\s\S]*?translate\(12px, 12px\)/);
	assert.match(css, /\.protocol-folder__sheet--2[\s\S]*?translate\(6px, 6px\)/);
	assert.match(css, /mix-blend-mode: normal/);
	assert.equal(policy.revision, '2.2.0');
	assert.ok(policy.trees.find((entry) => entry.source === 'src').extensions.includes('.png'));

	const about = pages.find((entry) => entry.id === 'page.about');
	assert.match(about.summary.en, /classified recurring character/);
	assert.match(about.body.en.join(' '), /personifies the development process itself/);
	assert.doesNotMatch(about.body.en.join(' '), /military medical-AI/i);
	const privacy = pages.find((entry) => entry.id === 'page.privacy-policy');
	assert.equal(privacy.revision, 3);
	assert.match(privacy.body.en.join(' '), /completion of the one-time welcome window/);
	assert.match(privacy.body.en.join(' '), /acknowledgements of notices for specific materials/);
	assert.match(privacy.body.en.join(' '), /requests[\s\S]*directly from Suno/i);
});
