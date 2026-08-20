import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0034: release 1.4.0 adopts the new interface and navigation contract', async () => {
	const [
		pkg,
		corpus,
		acts,
		profile,
		constitution,
		geometry,
		header,
		navigation,
		dock,
		article,
		css,
	] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('governance/acts.json'),
		readText('governance/PROFILE.md'),
		readText('CONSTITUTION.md'),
		readJson('src/interface-system/brand/iron-creed-mark.json'),
		readText('src/interface-system/components/site-header.tsx'),
		readText('src/interface-system/components/site-navigation.tsx'),
		readText('src/interface-system/components/header-action-dock.tsx'),
		readText('src/interface-system/templates/article-page-template.tsx'),
		readText('src/interface-system/iron-creed-interface.css'),
	]);

	assert.equal(pkg.version, '1.4.0');
	assert.equal(corpus.contentVersion, '1.6.0');
	assert.match(profile, /Редакция: `0\.7\.0`/);
	assert.match(constitution, /Редакция: `0\.2\.0`/);
	assert.match(constitution, /6bdb3f85236a45254724e7dabee840b2c573f5da/);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-development-001')?.revision,
		'1.3.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-site-experience-001')?.revision,
		'1.3.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-vox-public-source-001')?.revision,
		'2.0.0',
	);

	assert.equal(geometry.viewBox, '0 0 128 158');
	assert.ok(geometry.tridentPath.split('M').length - 1 >= 7);
	assert.match(geometry.pulsePath, /117\.9/);
	const crest = header.indexOf('className="header-crest"');
	const wordmark = header.indexOf('className="header-wordmark"');
	const controls = header.indexOf('className="header-control-cell"');
	assert.ok(crest >= 0 && wordmark > crest && controls > wordmark);
	assert.match(header, /<SidebarToggle locale=\{currentLocale\}/);
	assert.match(navigation, /role="separator"/);
	assert.match(navigation, /SIDEBAR_WIDTH_STORAGE_KEY/);
	assert.match(dock, /marker\.getClientRects\(\)\.length > 0/);
	assert.match(dock, /document\.addEventListener\('scroll', update, true\)/);
	assert.match(article, /deep: article\.publication/);
	assert.match(article, /markerId: 'article-actions'/);

	assert.match(css, /linear-gradient\(#fcfcfc, #fcfcfc\)/);
	assert.match(css, /linear-gradient\(#111416, #111416\)/);
	assert.match(css, /translate\(12px, 10px\)/);
	assert.match(css, /translate\(7px, 5px\)/);
	assert.match(css, /html\[data-theme='dark'\] \.corpus-index-page \.entity-index/);
	assert.match(css, /html\[data-sidebar='collapsed'\]/);
	assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.header-wordmark span/);
});

test('ICW-HIST-0034: VOX publishes pinned governance and enforcement without editorial internals', async () => {
	const [policy, prepare, verify, publish, guard, publicReadme, licensingPages] = await Promise.all(
		[
			readJson('vox/publication-policy.json'),
			readText('scripts/vox/prepare.mjs'),
			readText('scripts/vox/verify.mjs'),
			readText('scripts/vox/publish.mjs'),
			readText('constitutional-guard/run.mjs'),
			readText('vox/public-docs/README.md'),
			readJson('semantic-core/corpus/pages/registry.json'),
		],
	);

	assert.equal(policy.revision, '2.0.0');
	assert.ok(policy.trees.some((entry) => entry.source === 'constitutional-guard'));
	assert.ok(policy.trees.some((entry) => entry.source === 'governance/legislation'));
	assert.ok(policy.files.some((entry) => entry.source === 'CONSTITUTION.md'));
	assert.deepEqual(policy.gitlinks, [
		{
			path: 'code-constitution',
			repository: 'https://github.com/FOP-Oksana-Dubinetska/code-constitution.git',
			commit: '6bdb3f85236a45254724e7dabee840b2c573f5da',
		},
	]);
	for (const prefix of [
		'governance/prompts/',
		'governance/attestations/',
		'governance/reports/',
		'semantic-core/materials/',
		'semantic-core/dist/custom-gpt/',
	]) {
		assert.ok(policy.forbiddenDestinationPrefixes.includes(prefix), prefix);
	}
	assert.match(prepare, /gitlinkCount/);
	assert.match(verify, /Publication gitlinks drift from policy/);
	assert.match(publish, /mode: '160000'/);
	assert.match(publish, /type: 'commit'/);
	assert.match(guard, /'integrity'/);
	assert.match(publicReadme, /git submodule update --init --recursive/);

	const licensing = licensingPages.find((page) => page.id === 'page.licensing');
	assert.equal(licensing.revision, 3);
	assert.match(licensing.body.uk.join('\n'), /git-submodule/);
	assert.match(licensing.body.en.join('\n'), /Git submodule/);
	assert.match(licensing.body.en.join('\n'), /WARDEN source/);
});
