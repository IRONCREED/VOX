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

function collectQuestions(questions, depth = 1, result = { ids: [], maxDepth: 0 }) {
	result.maxDepth = Math.max(result.maxDepth, depth);
	for (const question of questions) {
		result.ids.push(question.id);
		if (question.children) {
			collectQuestions(question.children, depth + 1, result);
		}
	}
	return result;
}

test('ICW-HIST-0018: the bilingual research and programming corpus remain governed together', async () => {
	assert.ok(projectRoot);
	const [
		categories,
		tags,
		companion,
		renderer,
		brand,
		geometry,
		css,
		companionComponent,
		repository,
		packageManifest,
		acts,
		contentAct,
	] = await Promise.all([
		readCanonicalJson('content/config/categories.json'),
		readCanonicalJson('content/config/tags.json'),
		readCanonicalJson('content/config/companion.json'),
		readCanonicalText('src/interface-system/components/article-body.tsx'),
		readCanonicalText('src/interface-system/components/brand-mark.tsx'),
		readCanonicalJson('src/interface-system/brand/iron-creed-mark.json'),
		readCanonicalText('src/interface-system/iron-creed-interface.css'),
		readCanonicalText('src/interface-system/components/companion-panel.tsx'),
		readCanonicalText('src/content-catalog/adapters/markdown-content-repository.ts'),
		readCanonicalJson('package.json'),
		readCanonicalJson('governance/acts.json'),
		readCanonicalText('governance/legislation/CONTENT_FOUNDATION_2026-08-02.md'),
	]);

	assert.deepEqual(
		categories.map((category) => category.id),
		['games', 'programming', 'research', 'scenarios'],
	);
	assert.deepEqual(
		categories.map((category) => category.labels.uk),
		['Ігри', 'Програмування', 'Дослідження', 'Сценарії'],
	);
	assert.deepEqual(
		categories.map((category) => category.labels.en),
		['Games', 'Programming', 'Research', 'Scenarios'],
	);

	const files = await markdownFiles(path.join(projectRoot, 'content'));
	const sources = await Promise.all(files.map((filePath) => readFile(filePath, 'utf8')));
	const articles = sources.map((source, index) => metadataFrom(source, files[index]));
	assert.equal(articles.length, 4);
	assert.deepEqual(
		new Set(articles.map((article) => article.translationKey)),
		new Set(['from-body-to-signal', 'why-documentation']),
	);

	for (const translationKey of ['from-body-to-signal', 'why-documentation']) {
		const pair = articles.filter((article) => article.translationKey === translationKey);
		assert.deepEqual(pair.map((article) => article.locale).toSorted(), ['en', 'uk']);
		assert.deepEqual(pair[0].authors, ['Sam Starling', 'Oksana Dubinetska']);
		assert.deepEqual(pair[0].tags, pair[1].tags);
		assert.match(pair[0].edition, /^1\.0/);
	}

	const documentationPair = articles.filter(
		(article) => article.translationKey === 'why-documentation',
	);
	for (const article of documentationPair) {
		assert.equal(article.category, 'programming');
		assert.equal(article.status, 'published');
		assert.equal(article.publication.doi, '10.5281/zenodo.20608559');
		assert.equal(article.publication.pdfFile, '01-Literate-Programming-EN.pdf');
		assert.equal(article.companionScenario, 'why-documentation');
	}
	for (const source of sources.filter((source) => source.includes('"why-documentation"'))) {
		assert.match(source, /```ts/);
		assert.match(source, /```text/);
		assert.match(source, /Graphic(?:al)? slot G0[1-4]|Графічний слот G0[1-4]/);
		assert.doesNotMatch(source, /Continue the research with AI|Продовжити дослідження із ШІ/);
	}

	assert.equal(tags.length, 17);
	assert.deepEqual(
		new Set(articles.flatMap((article) => article.tags)),
		new Set(tags.map((tag) => tag.id)),
	);
	for (const id of [
		'documentation',
		'literate-programming',
		'donald-knuth',
		'web',
		'software-engineering',
		'reproducibility',
		'ai-assisted-development',
	]) {
		assert.ok(tags.some((tag) => tag.id === id));
	}

	const researchUk = collectQuestions(companion['body-to-signal'].uk.questions);
	const researchEn = collectQuestions(companion['body-to-signal'].en.questions);
	assert.equal(companion['body-to-signal'].uk.questions.length, 6);
	assert.ok(researchUk.maxDepth >= 4);
	assert.deepEqual(researchUk.ids.toSorted(), researchEn.ids.toSorted());

	const documentationUk = collectQuestions(companion['why-documentation'].uk.questions);
	const documentationEn = collectQuestions(companion['why-documentation'].en.questions);
	assert.equal(companion['why-documentation'].uk.questions.length, 8);
	assert.equal(companion['why-documentation'].en.questions.length, 8);
	assert.equal(documentationUk.ids.length, 47);
	assert.equal(documentationUk.maxDepth, 2);
	assert.equal(new Set(documentationUk.ids).size, documentationUk.ids.length);
	assert.deepEqual(documentationUk.ids, documentationEn.ids);

	assert.match(renderer, /kind: 'code'/);
	assert.match(renderer, /codeFence/);
	assert.match(renderer, /<pre data-language=\{block\.language\}/);
	assert.match(css, /\.article-body pre\s*\{/);
	assert.match(css, /\.article-body pre code\s*\{/);

	assert.equal(geometry.state, 'peak');
	assert.equal(geometry.pulseFrames, undefined);
	assert.match(brand, /data-brand-state=\{geometry\.state\}/);
	assert.doesNotMatch(brand, /motion|pulseFrames|data-brand-frame/);
	assert.match(css, /html\[data-theme=['"]dark['"]\] \.brand-mark\s*\{/);

	assert.match(companionComponent, /const questionsForLevel = selectedQuestion/);
	assert.match(companionComponent, /className="question-selection"/);
	assert.match(companionComponent, /className="question-path"/);
	assert.match(companionComponent, /navigate\(parentPath\)/);
	assert.doesNotMatch(companionComponent, /branch-navigation|sibling-branches|startNewBranch/);

	assert.match(repository, /query:\s*CatalogQuery/);
	assert.match(repository, /article\.tags\.includes\(query\.tagId\)/);

	assert.equal(packageManifest.version, '0.8.0');
	for (const id of [
		'icw-act-development-001',
		'icw-act-site-experience-001',
		'icw-act-patterns-001',
	]) {
		assert.equal(acts.acts.find((entry) => entry.id === id)?.revision, '0.8.0');
	}
	assert.ok(
		acts.acts.some(
			(entry) =>
				entry.id === 'icw-act-content-foundation-001' &&
				entry.revision === '1.0.0' &&
				entry.status === 'active',
		),
	);
	assert.match(contentAct, /ICW-CONT08/);
});
