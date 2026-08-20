import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { readCanonicalJson, readCanonicalText } from '../testing-interface/site-driver.mjs';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;

async function markdownFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((entry) => {
			const entryPath = path.join(directory, entry.name);
			return entry.isDirectory()
				? markdownFiles(entryPath)
				: Promise.resolve(entry.name.endsWith('.md') ? [entryPath] : []);
		}),
	);
	return nested.flat();
}

function metadataFrom(source, filePath) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
	assert.ok(match, `${filePath} must contain front matter`);
	return JSON.parse(match[1]);
}

test('ICW-HIST-0008: stabilization remains configuration-driven and progressive', async () => {
	const [
		behavior,
		categories,
		systemNavigation,
		repository,
		header,
		companion,
		feed,
		hint,
		articleTemplate,
		brand,
		loader,
		css,
		stabilizationAct,
	] = await Promise.all([
		readCanonicalJson('content/config/interface-behavior.json'),
		readCanonicalJson('content/config/categories.json'),
		readCanonicalJson('content/config/navigation.json'),
		readCanonicalText('src/content-catalog/adapters/markdown-content-repository.ts'),
		readCanonicalText('src/interface-system/components/site-header.tsx'),
		readCanonicalText('src/interface-system/components/companion-panel.tsx'),
		readCanonicalText('src/interface-system/components/material-feed.tsx'),
		readCanonicalText('src/interface-system/components/contextual-hint.tsx'),
		readCanonicalText('src/interface-system/templates/article-page-template.tsx'),
		readCanonicalText('src/interface-system/components/brand-mark.tsx'),
		readCanonicalText('src/interface-system/components/loading-gate.tsx'),
		readCanonicalText('src/interface-system/iron-creed-interface.css'),
		readCanonicalText('governance/legislation/STABILIZATION_2026-08-01.md'),
	]);

	assert.equal(behavior.loader.minimumVisibleMs, 3000);
	assert.ok(behavior.loader.maximumWaitMs >= behavior.loader.minimumVisibleMs);
	assert.equal(behavior.typewriter.invitationCharacterMs, 11);
	assert.equal(behavior.typewriter.answerCharacterMs, 7);
	assert.match(loader, /interfaceBehavior\.loader\.minimumVisibleMs/);
	assert.match(loader, /MINIMUM_VISIBLE_TIME = 2400/);
	assert.match(companion, /interfaceBehavior\.typewriter\.answerCharacterMs/);

	assert.ok(categories.length > 0);
	for (const category of categories) {
		assert.ok(category.id);
		assert.ok(category.labels.uk);
		assert.ok(category.labels.en);
		assert.ok(category.descriptions.uk);
		assert.ok(category.descriptions.en);
	}
	assert.ok(systemNavigation.some((item) => item.kind === 'home'));
	assert.ok(systemNavigation.some((item) => item.kind === 'disabled'));
	assert.match(repository, /navigationSource/);
	assert.doesNotMatch(header, /documentation|architecture|memory|analytics|reflection|protocols/);

	assert.match(header, /className="header-controls"/);
	assert.match(companion, /companionRequiresJavaScript/);
	assert.match(feed, /isEnhanced \? '↓' : '→'/);
	assert.match(hint, /className="contextual-hint__close"/);
	assert.match(articleTemplate, /article\.memoryLine/);
	assert.match(brand, /export const BRAND_MARK_SRC/);
	assert.match(loader, /BRAND_MARK_SRC/);
	assert.match(css, /\.companion-card\s*\{[\s\S]*?min-height:\s*0/);
	assert.match(css, /\.continue-button\s*\{[\s\S]*?margin-top:\s*0/);
	assert.match(css, /html\[data-theme='dark'\] \.loading-gate/);
	assert.match(stabilizationAct, /ICW-STAB13/);

	const files = await markdownFiles(path.join(projectRoot, 'content'));
	const articles = await Promise.all(
		files.map(async (filePath) => metadataFrom(await readFile(filePath, 'utf8'), filePath)),
	);
	for (const article of articles) {
		assert.ok(article.description?.trim(), `${article.id} lacks description`);
		assert.ok(article.memoryLine?.trim(), `${article.id} lacks memoryLine`);
	}
});
