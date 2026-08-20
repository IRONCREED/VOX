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

test('ICW-HIST-0010: the first real corpus and recursive conversation tree remain canonical', async () => {
	assert.ok(projectRoot);
	const [categories, companion, acts, headerCss, articleRenderer, act] = await Promise.all([
		readCanonicalJson('content/config/categories.json'),
		readCanonicalJson('content/config/companion.json'),
		readCanonicalJson('governance/acts.json'),
		readCanonicalText('src/interface-system/iron-creed-interface.css'),
		readCanonicalText('src/interface-system/components/article-body.tsx'),
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
	const articles = await Promise.all(
		files.map(async (filePath) => metadataFrom(await readFile(filePath, 'utf8'), filePath)),
	);
	assert.equal(articles.length, 2);
	assert.deepEqual(articles.map((article) => article.locale).toSorted(), ['en', 'uk']);
	for (const article of articles) {
		assert.equal(article.translationKey, 'from-body-to-signal');
		assert.equal(article.category, 'research');
		assert.equal(article.status, 'published');
		assert.deepEqual(article.authors, ['Sam Starling', 'Oksana Dubinetska']);
		assert.ok(article.type);
		assert.ok(article.tags.length >= 10);
		assert.match(article.edition, /^1\.0/);
		assert.equal(article.publication.doi, '10.5281/zenodo.20647570');
	}

	const ukrainianTree = collectQuestions(companion['body-to-signal'].uk.questions);
	const englishTree = collectQuestions(companion['body-to-signal'].en.questions);
	assert.equal(companion['body-to-signal'].uk.questions.length, 6);
	assert.equal(companion['body-to-signal'].en.questions.length, 6);
	assert.ok(ukrainianTree.maxDepth >= 4);
	assert.equal(new Set(ukrainianTree.ids).size, ukrainianTree.ids.length);
	assert.deepEqual(ukrainianTree.ids.toSorted(), englishTree.ids.toSorted());

	assert.match(headerCss, /\.locale-switcher\s*\{[\s\S]*?align-items:\s*center/);
	assert.match(headerCss, /\.locale-switcher a\s*\{[\s\S]*?display:\s*inline-flex/);
	assert.match(headerCss, /\.locale-switcher a\s*\{[\s\S]*?align-items:\s*center/);
	assert.match(articleRenderer, /kind: 'paragraph' \| 'blockquote'/);
	assert.match(articleRenderer, /ordered: boolean/);
	assert.match(articleRenderer, /noreferrer noopener/);

	assert.ok(
		acts.acts.some(
			(entry) =>
				entry.id === 'icw-act-content-foundation-001' &&
				entry.revision === '1.0.0' &&
				entry.status === 'active',
		),
	);
	assert.match(act, /ICW-CONT08/);
});
