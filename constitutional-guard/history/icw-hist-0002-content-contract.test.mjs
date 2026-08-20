import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

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

test('ICW-HIST-0002: the bilingual content corpus has unique routes and translation pairs', async () => {
	assert.ok(projectRoot);
	const files = await markdownFiles(path.join(projectRoot, 'content'));
	const articles = await Promise.all(
		files.map(async (filePath) => metadataFrom(await readFile(filePath, 'utf8'), filePath)),
	);

	assert.ok(articles.length >= 12);

	const ids = new Set();
	const routes = new Set();
	const editions = new Set();
	for (const article of articles) {
		assert.match(article.locale, /^(uk|en)$/);
		assert.equal(article.status, 'published');
		assert.ok(article.title);
		assert.ok(article.description);
		assert.ok(article.folderLabel.startsWith('IRON CREED PROTOCOL'));

		const route = `${article.locale}/${article.category}/${article.slug}`;
		const edition = `${article.translationKey}/${article.locale}`;
		assert.equal(ids.has(article.id), false, `duplicate id ${article.id}`);
		assert.equal(routes.has(route), false, `duplicate route ${route}`);
		assert.equal(editions.has(edition), false, `duplicate edition ${edition}`);
		ids.add(article.id);
		routes.add(route);
		editions.add(edition);
	}

	for (const translationKey of new Set(articles.map((article) => article.translationKey))) {
		assert.ok(editions.has(`${translationKey}/uk`), `${translationKey} lacks uk`);
		assert.ok(editions.has(`${translationKey}/en`), `${translationKey} lacks en`);
	}
});
