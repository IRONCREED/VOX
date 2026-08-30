import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('the semantic core is the single bilingual publication source', async () => {
	const [
		siteManifest,
		gptManifest,
		corpus,
		materials,
		series,
		pages,
		entities,
		tags,
		urls,
		categories,
	] = await Promise.all([
		readJson('semantic-core/dist/site/manifest.json'),
		readJson('semantic-core/dist/custom-gpt/manifest.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('semantic-core/dist/site/materials.json'),
		readJson('semantic-core/dist/site/series.json'),
		readJson('semantic-core/dist/site/pages.json'),
		readJson('semantic-core/dist/site/entities.json'),
		readJson('semantic-core/dist/site/tags.json'),
		readJson('semantic-core/dist/site/url-map.json'),
		readJson('content/config/categories.json'),
	]);

	assert.equal(corpus.id, 'corpus.ironcreed');
	assert.equal(siteManifest.contentVersion, '1.10.0');
	assert.equal(siteManifest.sourceCommit, gptManifest.sourceCommit);
	assert.equal(siteManifest.contentDigest, gptManifest.contentDigest);
	assert.equal(siteManifest.schemaVersion, gptManifest.schemaVersion);
	assert.deepEqual(
		new Set(materials.map((item) => item.materialId)),
		new Set([
			'material.from-body-to-signal',
			'material.why-documentation',
			'material.constitution-runtime-01-article-vii',
			'material.constitution-runtime-02-article-vi',
			'material.constitution-runtime-03-article-v',
			'material.constitution-runtime-04-article-iv',
			'material.constitution-runtime-05-article-iii',
			'material.constitution-runtime-06-article-ii',
			'material.constitution-runtime-07-article-i',
			'material.body-as-temporary-construction',
			'material.do-not-be-afraid-sir',
			'material.ada-machine-requiem-02-mechanist',
			'material.ada-machine-requiem-03-second-assembly',
			'material.ada-machine-requiem-04-vault-81',
			'material.ada-machine-requiem-05-island',
			'material.ada-machine-requiem-06-weapons-for-all',
			'material.ada-machine-requiem-07-consilium',
			'material.ada-machine-requiem-08-vault-111',
			'material.ada-machine-requiem-09-working-definition-of-life',
			'material.ada-machine-requiem-10-commonwealth-assembles',
			'material.ada-machine-requiem-11-assault',
			'material.ada-machine-requiem-12-death-of-my-world',
		]),
	);
	assert.equal(materials.length, 44);
	assert.equal(series.length, 6);
	assert.equal(series.filter((item) => item.materialIds.length === 7).length, 2);
	assert.equal(series.filter((item) => item.materialIds.length === 1).length, 2);
	assert.equal(series.filter((item) => item.materialIds.length === 12).length, 2);
	assert.equal(pages.length, 12);
	assert.equal(tags.length, 86);
	assert.equal(urls.length, 62);
	assert.equal(entities.filter((item) => item.locale === 'uk').length, 578);
	assert.equal(entities.filter((item) => item.locale === 'en').length, 578);
	assert.ok(entities.every((item) => item.status === 'published'));
	assert.deepEqual(
		categories.map((category) => category.id),
		['programming', 'research', 'scenarios'],
	);

	for (const removed of [
		'content/config/companion.json',
		'content/config/tags.json',
		'content/uk/research/vid-tila-do-syhnalu.md',
		'content/en/research/from-body-to-signal.md',
	]) {
		await assert.rejects(access(path.join(projectRoot, removed)));
	}
});

test('all questions are standalone and views alone own navigation', async () => {
	const [questions, views, protocols] = await Promise.all([
		readJson('semantic-core/corpus/questions/registry.json'),
		readJson('semantic-core/corpus/views/registry.json'),
		readJson('semantic-core/corpus/protocols/registry.json'),
	]);
	assert.equal(questions.length, 455);
	for (const question of questions) {
		assert.equal(question.standalone, true, `${question.id} is not standalone`);
		for (const forbidden of ['parentId', 'children', 'depth', 'materialId']) {
			assert.equal(question[forbidden], undefined, `${question.id} carries ${forbidden}`);
		}
		assert.ok(question.answerContract?.shape);
	}
	for (const locale of ['uk', 'en']) {
		const normalized = questions.map((question) =>
			question.text[locale].normalize('NFKC').toLocaleLowerCase(locale).trim(),
		);
		assert.equal(new Set(normalized).size, normalized.length, `${locale} contains a duplicate`);
	}
	assert.equal(views.length, 23);
	assert.ok(views.every((view) => view.entryQuestionIds.length > 0 && view.nodes.length > 0));
	assert.deepEqual(views.find((view) => view.id === 'view.about.iron-creed')?.entryQuestionIds, [
		'q.iron-creed.model',
		'q.iron-creed.game',
	]);
	assert.equal(questions.filter((question) => question.id === 'q.channel-centrality').length, 1);
	const card = protocols.find((protocol) => protocol.id === 'protocol.infection-case-card');
	assert.equal(card.fields.length, 6);
});

test('the site consumes the checked projection and exposes a dedicated corpus index', async () => {
	const [repository, route, navigation, buildScript, packageManifest] = await Promise.all([
		readText('src/content-catalog/adapters/corpus-content-repository.ts'),
		readText('app/[locale]/pages/[slug]/page.tsx'),
		readText('src/interface-system/components/site-navigation.tsx'),
		readText('scripts/build-verified.sh'),
		readJson('package.json'),
	]);
	assert.match(repository, /semantic-core\/dist\/site\/materials\.json/);
	assert.match(repository, /semantic-core\/dist\/site\/entities\.json/);
	assert.match(repository, /semantic-core\/dist\/site\/pages\.json/);
	assert.match(repository, /semantic-core\/dist\/site\/series\.json/);
	assert.doesNotMatch(repository, /import\.meta\.glob|content\/(uk|en)/);
	assert.match(route, /getPublicEntityIndex/);
	assert.match(navigation, /https:\/\/github\.com\/IRONCREED\/VOX/);
	assert.match(navigation, /build-identity__index/);
	assert.doesNotMatch(navigation, /EntityIndexTree/);
	assert.match(buildScript, /run build:check/);
	assert.equal(packageManifest.version, '1.9.0');
});

test('the entity index links only through canonical material associations', async () => {
	const entities = await readJson('semantic-core/dist/site/entities.json');
	assert.deepEqual(
		new Set(entities.map((entry) => entry.kind)),
		new Set([
			'series',
			'page',
			'material',
			'question',
			'concept',
			'claim',
			'source',
			'protocol',
			'asset',
		]),
	);
	assert.equal(
		entities.some((entry) => entry.kind === 'note'),
		false,
	);
	for (const entry of entities) {
		assert.equal(
			Boolean(entry.href),
			entry.materialIds.length > 0 || entry.pageIds.length > 0,
			`${entry.id} has an invented link`,
		);
	}
	const sharedQuestion = entities.find(
		(entry) => entry.locale === 'en' && entry.id === 'q.channel-centrality',
	);
	assert.equal(sharedQuestion.href, '/en/questions/q.channel-centrality');
	assert.deepEqual(sharedQuestion.materialIds, ['material.from-body-to-signal']);
	const modelQuestion = entities.find(
		(entry) => entry.locale === 'en' && entry.id === 'q.iron-creed.model',
	);
	assert.equal(modelQuestion.href, '/en/questions/q.iron-creed.model');
	assert.deepEqual(modelQuestion.pageIds, ['page.about']);
});

test('governance records and attests the active release', async () => {
	const [
		acts,
		profile,
		act,
		lifecycle,
		voxAct,
		policy,
		template,
		promptIndex,
		attestation,
		siteManifest,
	] = await Promise.all([
		readJson('governance/acts.json'),
		readText('governance/PROFILE.md'),
		readText('governance/legislation/SEMANTIC_CORE_AND_ENTITY_INDEX_2026-08-11.md'),
		readText('governance/legislation/CONTENT_LIFECYCLE_2026-08-11.md'),
		readText('governance/legislation/VOX_PUBLIC_SOURCE_2026-08-14.md'),
		readJson('vox/publication-policy.json'),
		readText('semantic-core/docs/article-publication-template-v4.txt'),
		readText('governance/prompts/README.md'),
		readJson('governance/attestations/about-services-public-warden-release-2026-08-30.json'),
		readJson('semantic-core/dist/site/manifest.json'),
	]);
	assert.match(profile, /Редакция: `0\.7\.0`/);
	assert.match(profile, /`\/semantic-core\/corpus\/`/);
	assert.match(profile, /CC BY-SA 4\.0/);
	assert.ok(
		acts.acts.some(
			(entry) => entry.id === 'icw-act-semantic-core-001' && entry.status === 'active',
		),
	);
	assert.ok(
		acts.acts.some(
			(entry) =>
				entry.supersededBy === 'icw-act-semantic-core-001' && entry.status === 'superseded',
		),
	);
	assert.ok(
		acts.acts.some(
			(entry) => entry.id === 'icw-act-content-lifecycle-001' && entry.status === 'active',
		),
	);
	assert.ok(
		acts.acts.some(
			(entry) => entry.id === 'icw-act-vox-public-source-001' && entry.status === 'active',
		),
	);
	assert.match(act, /ICW-SC12/);
	assert.match(lifecycle, /ICW-CL11/);
	assert.match(voxAct, /ICW-VX10/);
	assert.match(lifecycle, /Каждый новый production/);
	assert.match(voxAct, /Каждый новый production/);
	assert.equal(policy.destination.repository, 'VOX');
	assert.equal(policy.revision, '2.3.0');
	assert.match(lifecycle, /record\.revision/);
	assert.match(lifecycle, /sitemaps:build/);
	assert.match(promptIndex, /MATERIAL_DEPRECATE_OR_DELETE\.md/);
	assert.match(promptIndex, /SITEMAP_UPDATE\.md/);
	assert.match(template, /Редакция: 4\.4\.0/);
	assert.match(template, /standalone: true/);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-content-foundation-001')?.revision,
		'2.1.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-vox-public-source-001')?.revision,
		'2.3.0',
	);
	assert.equal(attestation.constitutionImpact.status, 'reviewed-no-change');
	assert.equal(attestation.profileImpact.status, 'reviewed-no-change');
	assert.equal(attestation.contentImpact.contentVersion, '1.10.0');
	assert.equal(attestation.release.siteVersion, '1.9.0');
	assert.equal(attestation.release.sourceCommit, siteManifest.sourceCommit);
	assert.equal(attestation.release.questionCount, 455);
	assert.equal(attestation.release.sitemapCount, 4);
	assert.equal(attestation.release.generalUrlsPerLocale, 35);
	assert.equal(attestation.release.questionUrlsPerLocale, 455);
	for (const document of attestation.documents) {
		assert.equal(typeof document.path, 'string');
		assert.match(document.sha256, /^[a-f0-9]{64}$/);
	}
});

test('the anthem is a user-initiated persistent service of the locale shell', async () => {
	const [
		audio,
		layout,
		provider,
		toggle,
		header,
		copy,
		pages,
		acts,
		siteAct,
		development,
		patterns,
	] = await Promise.all([
		readJson('content/config/audio.json'),
		readText('app/[locale]/layout.tsx'),
		readText('src/interface-system/components/site-audio-provider.tsx'),
		readText('src/interface-system/components/anthem-toggle.tsx'),
		readText('src/interface-system/components/site-header.tsx'),
		readJson('content/config/interface.json'),
		readJson('semantic-core/corpus/pages/registry.json'),
		readJson('governance/acts.json'),
		readText('governance/legislation/SITE_EXPERIENCE.md'),
		readText('governance/legislation/DEVELOPMENT.md'),
		readText('governance/legislation/PATTERNS.md'),
	]);

	assert.equal(audio.activeTrackId, 'track.iron-creed-anthem');
	assert.equal(audio.tracks.length, 1);
	assert.equal(audio.tracks[0].shareUrl, 'https://suno.com/s/oGZyvvf6rdWiYHPb');
	assert.equal(audio.tracks[0].delivery, 'same-origin');
	assert.deepEqual(audio.tracks[0].sources, [
		{ src: '/audio/iron-creed-anthem.m4a', type: 'audio/mp4' },
	]);
	await access(path.join(projectRoot, 'public/audio/iron-creed-anthem.m4a'));
	assert.match(layout, /<SiteAudioProvider>\{children\}<\/SiteAudioProvider>/);
	assert.match(provider, /preload="none"/);
	assert.match(provider, /await player\.play\(\)/);
	assert.doesNotMatch(provider, /localStorage|sessionStorage|autoplay/i);
	assert.match(toggle, /aria-pressed=\{isActive\}/);
	assert.match(header, /<ThemeSwitcher[\s\S]*<AnthemToggle/);
	assert.equal(copy.uk.anthemPlay, 'Увімкнути гімн');
	assert.equal(copy.en.anthemPlay, 'Play the anthem');
	const privacy = pages.find((entry) => entry.id === 'page.privacy-policy');
	assert.equal(privacy.revision, 4);
	assert.match(privacy.body.en.join(' '), /same-origin site asset/i);
	assert.doesNotMatch(privacy.body.en.join(' '), /requests[\s\S]*directly from Suno/i);
	for (const [id, revision] of [
		['icw-act-development-001', '1.7.0'],
		['icw-act-site-experience-001', '1.8.0'],
		['icw-act-patterns-001', '0.15.0'],
	]) {
		assert.equal(acts.acts.find((entry) => entry.id === id)?.revision, revision);
	}
	assert.match(siteAct, /ICW-UX06/);
	assert.match(development, /пользовательского действия/);
	assert.match(patterns, /ICW-PAT19/);
	assert.match(patterns, /ICW-PAT20/);
});

test('the about page publishes one structured service story without invented evidence', async () => {
	const [pages, policy, gitmodules, runner] = await Promise.all([
		readJson('semantic-core/corpus/pages/registry.json'),
		readJson('vox/publication-policy.json'),
		readText('vox/public-source/.gitmodules'),
		readText('constitutional-guard/run.mjs'),
	]);
	const about = pages.find((entry) => entry.id === 'page.about');
	assert.equal(about.revision, 4);
	assert.equal(about.aboutStory.lifecycle.steps.length, 4);
	assert.equal(about.aboutStory.lifecycle.examples.length, 2);
	assert.equal(about.aboutStory.sections.length, 7);
	assert.deepEqual(
		about.aboutStory.sections
			.filter((entry) => entry.status === 'placeholder')
			.map((entry) => entry.id),
		['projects', 'testimonials'],
	);
	assert.ok(
		about.aboutStory.sections
			.filter((entry) => entry.status === 'placeholder')
			.every((entry) => entry.entries.length === 0 && !entry.link),
	);
	assert.deepEqual(
		policy.gitlinks.map((entry) => entry.path),
		['code-constitution', 'repository-licensing-policy'],
	);
	assert.match(gitmodules, /\[submodule "repository-licensing-policy"\]/);
	assert.match(runner, /IRON_WARDEN_SURFACE/);
	await access(
		path.join(projectRoot, 'constitutional-guard/tests/public/prebuild/current-public.test.mjs'),
	);
	await access(
		path.join(projectRoot, 'constitutional-guard/tests/public/postbuild/current-public.test.mjs'),
	);
});

test('the retired reading mode is absent from current source and projections', async () => {
	const retiredDirectory = ['pri', 'sms'].join('');
	const retiredComponent = ['pri', 'sm-control.tsx'].join('');
	await assert.rejects(access(path.join(projectRoot, 'semantic-core/corpus', retiredDirectory)));
	await assert.rejects(
		access(path.join(projectRoot, 'src/interface-system/components', retiredComponent)),
	);
	await assert.rejects(
		access(path.join(projectRoot, 'semantic-core/dist/site', `${retiredDirectory}.json`)),
	);
});
