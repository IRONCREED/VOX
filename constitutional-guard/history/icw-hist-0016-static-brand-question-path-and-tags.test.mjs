import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { readCanonicalJson, readCanonicalText } from '../testing-interface/site-driver.mjs';

function cssBlock(source, selector) {
	const start = source.indexOf(`${selector} {`);
	assert.notEqual(start, -1, `missing CSS selector ${selector}`);
	const end = source.indexOf('}', start);
	assert.notEqual(end, -1, `unterminated CSS selector ${selector}`);
	return source.slice(start, end + 1);
}

async function importTypeScriptModule(relativePath) {
	const source = await readCanonicalText(relativePath);
	const output = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
	const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
	return import(url);
}

function metadataFrom(source) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
	assert.ok(match);
	return JSON.parse(match[1]);
}

test('ICW-HIST-0016: static peak branding, one question level, and stable tags remain canonical', async () => {
	const [
		geometry,
		brandAsset,
		faviconAsset,
		brand,
		header,
		loader,
		folder,
		css,
		companion,
		tags,
		ukrainianSource,
		englishSource,
		repository,
		feed,
		packageManifest,
		acts,
		act,
		debt,
		behavior,
		categories,
		navigation,
		theme,
		hint,
		articleTemplate,
		interfaceCorrections,
		stabilization,
	] = await Promise.all([
		readCanonicalJson('src/interface-system/brand/iron-creed-mark.json'),
		readCanonicalText('public/brand/iron-creed-mark.svg'),
		readCanonicalText('public/favicon.svg'),
		readCanonicalText('src/interface-system/components/brand-mark.tsx'),
		readCanonicalText('src/interface-system/components/site-header.tsx'),
		readCanonicalText('src/interface-system/components/loading-gate.tsx'),
		readCanonicalText('src/interface-system/components/protocol-folder.tsx'),
		readCanonicalText('src/interface-system/iron-creed-interface.css'),
		readCanonicalText('src/interface-system/components/companion-panel.tsx'),
		readCanonicalJson('content/config/tags.json'),
		readCanonicalText('content/uk/research/vid-tila-do-syhnalu.md'),
		readCanonicalText('content/en/research/from-body-to-signal.md'),
		readCanonicalText('src/content-catalog/adapters/markdown-content-repository.ts'),
		readCanonicalText('src/interface-system/components/material-feed.tsx'),
		readCanonicalJson('package.json'),
		readCanonicalJson('governance/acts.json'),
		readCanonicalText('governance/legislation/INTERFACE_REFINEMENT_2026-08-02.md'),
		readCanonicalText('governance/reports/technical-debt/ICW-DEBT-CATALOG-001.md'),
		readCanonicalJson('content/config/interface-behavior.json'),
		readCanonicalJson('content/config/categories.json'),
		readCanonicalJson('content/config/navigation.json'),
		readCanonicalText('src/interface-system/components/theme-switcher.tsx'),
		readCanonicalText('src/interface-system/components/contextual-hint.tsx'),
		readCanonicalText('src/interface-system/templates/article-page-template.tsx'),
		readCanonicalText('governance/legislation/INTERFACE_CORRECTIONS_2026-07-30.md'),
		readCanonicalText('governance/legislation/STABILIZATION_2026-08-01.md'),
	]);

	for (const selector of [
		'.header-crest',
		'.nav-icon',
		'.material-card__folder',
		'.material-pagination__pages a',
		'.article-route > a:first-child',
		'.article-action__icon',
		'.suggestion-list',
		'.suggestion-list button',
		'.loading-gate',
	]) {
		const block = cssBlock(css, selector);
		assert.match(block, /display:\s*flex/);
		assert.doesNotMatch(block, /display:\s*grid/);
	}

	assert.equal(geometry.state, 'peak');
	assert.equal(geometry.pulseFrames, undefined);
	assert.match(brand, /type BrandMarkVariant = ['"]folder['"] \| ['"]header['"] \| ['"]loader['"]/);
	assert.match(brand, /data-brand-state=\{geometry\.state\}/);
	assert.doesNotMatch(brand, /motion|pulseFrames|data-brand-frame/);
	assert.match(header, /<BrandMark variant="header" \/>/);
	assert.match(loader, /<BrandMark variant="loader" \/>/);
	assert.match(folder, /<BrandMark variant="folder" \/>/);
	assert.match(css, /\.brand-mark--header\s*\{[\s\S]*?height:\s*1em/);
	assert.match(css, /html\[data-theme=['"]dark['"]\] \.brand-mark\s*\{/);
	assert.doesNotMatch(css, /brand-pulse-trace|brand-mark--animated/);

	for (const asset of [brandAsset, faviconAsset]) {
		assert.match(asset, new RegExp(geometry.tridentPath));
		assert.match(asset, new RegExp(geometry.pulsePath));
		assert.match(asset, /prefers-color-scheme:\s*dark/);
	}
	assert.match(faviconAsset, /viewBox="0 0 158 158"/);

	assert.match(companion, /const questionsForLevel = selectedQuestion/);
	assert.match(companion, /className="question-selection"/);
	assert.match(companion, /className="question-path"/);
	assert.match(companion, /copy\.questionDepth/);
	assert.match(companion, /navigate\(parentPath\)/);
	assert.match(companion, /setAnswerRun\(\(current\) => current \+ 1\)/);
	assert.match(companion, /interfaceBehavior\.typewriter\.answerCharacterMs/);
	assert.match(companion, /companionRequiresJavaScript/);
	assert.doesNotMatch(companion, /branch-navigation|sibling-branches|startNewBranch/);
	assert.doesNotMatch(companion, /continueConversation|conversationFuture/);
	assert.doesNotMatch(companion, /className="companion-signal/);

	assert.equal(behavior.loader.minimumVisibleMs, 3000);
	assert.ok(behavior.loader.maximumWaitMs >= behavior.loader.minimumVisibleMs);
	assert.equal(behavior.typewriter.invitationCharacterMs, 11);
	assert.equal(behavior.typewriter.answerCharacterMs, 7);
	assert.match(loader, /interfaceBehavior\.loader\.minimumVisibleMs/);
	assert.match(loader, /MINIMUM_VISIBLE_TIME = 2400/);
	assert.match(loader, /MAXIMUM_WAIT_TIME = 6000/);
	assert.match(theme, /THEME_STORAGE_KEY/);
	assert.match(theme, /document\.documentElement\.dataset\.theme/);
	assert.match(hint, /className="contextual-hint__close"/);
	assert.match(articleTemplate, /article\.memoryLine/);
	assert.match(interfaceCorrections, /ICW-CORR08/);
	assert.match(stabilization, /ICW-STAB13/);
	assert.ok(navigation.some((item) => item.kind === 'home'));
	assert.ok(navigation.some((item) => item.kind === 'disabled'));
	for (const category of categories) {
		assert.ok(category.id);
		assert.ok(category.labels.uk);
		assert.ok(category.labels.en);
		assert.ok(category.descriptions.uk);
		assert.ok(category.descriptions.en);
	}

	const typewriter = await importTypeScriptModule(
		'src/interface-system/behaviors/typewriter-run.ts',
	);
	let repeatedRun = { runId: 'question:1', visibleLength: 18 };
	assert.equal(typewriter.visibleLengthForRun(repeatedRun, 'question:2'), 0);
	for (let index = 0; index < 9; index += 1) {
		repeatedRun = typewriter.advanceTypewriterFrame(repeatedRun, 'question:2', 18);
	}
	assert.deepEqual(repeatedRun, { runId: 'question:2', visibleLength: 18 });

	const zenodo = await importTypeScriptModule('src/content-catalog/adapters/zenodo-record.ts');
	const publication = {
		provider: 'zenodo',
		recordId: '20608559',
		title: 'Literate Programming',
		doi: '10.5281/zenodo.20608559',
		pdfFile: '01-Literate-Programming-EN.pdf',
	};
	const resolved = zenodo.resolveZenodoPdf(
		{
			id: 20608559,
			files: [
				{
					key: publication.pdfFile,
					size: 383500,
					links: {
						self: 'https://zenodo.org/api/records/20608559/files/01-Literate-Programming-EN.pdf/content',
					},
				},
			],
		},
		publication,
	);
	assert.equal(resolved.size, 383500);
	assert.match(resolved.downloadUrl, /^https:\/\/zenodo\.org\/api\/records\//);

	const ukrainian = metadataFrom(ukrainianSource);
	const english = metadataFrom(englishSource);
	for (const article of [ukrainian, english]) {
		assert.ok(article.description?.trim());
		assert.ok(article.memoryLine?.trim());
	}
	assert.equal(tags.length, 10);
	assert.deepEqual(ukrainian.tags, english.tags);
	assert.deepEqual(new Set(ukrainian.tags), new Set(tags.map((tag) => tag.id)));
	assert.match(repository, /query:\s*CatalogQuery/);
	assert.match(repository, /article\.tags\.includes\(query\.tagId\)/);
	assert.match(feed, /className="tag-filter"/);
	assert.match(feed, /query\.set\(['"]tag['"], activeTagId\)/);
	assert.match(debt, /AND\/OR/);

	assert.equal(packageManifest.version, '0.7.0');
	for (const id of [
		'icw-act-development-001',
		'icw-act-site-experience-001',
		'icw-act-patterns-001',
	]) {
		assert.equal(acts.acts.find((entry) => entry.id === id)?.revision, '0.7.0');
	}
	for (const id of ['icw-act-interface-corrections-001', 'icw-act-interface-stabilization-001']) {
		assert.equal(acts.acts.find((entry) => entry.id === id)?.status, 'active');
	}
	for (const id of ['icw-act-brand-pulse-001', 'icw-act-brand-fidelity-001']) {
		const superseded = acts.acts.find((entry) => entry.id === id);
		assert.equal(superseded?.status, 'superseded');
		assert.equal(superseded?.supersededBy, 'icw-act-interface-refinement-001');
	}
	assert.ok(
		acts.acts.some(
			(entry) =>
				entry.id === 'icw-act-interface-refinement-001' &&
				entry.revision === '1.0.0' &&
				entry.status === 'active',
		),
	);
	assert.match(act, /ICW-REF07/);
});
