import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0035: the compiled shell places brand, controls, and collapse action in the new order', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/');
	assert.equal(response.status, 200);
	const html = await response.text();
	const crest = html.indexOf('class="header-crest"');
	const wordmark = html.indexOf('class="header-wordmark"');
	const toggle = html.indexOf('class="sidebar-toggle"');
	const controls = html.indexOf('class="header-control-cell"');
	assert.ok(crest >= 0 && wordmark > crest && toggle > wordmark && controls > toggle);
	assert.match(html, /aria-controls="primary-navigation"/);
	assert.match(html, /class="brand-mark brand-mark--header"/);
	assert.match(html, /M64 9\.1L67\.7 21\.5/);
});

test('ICW-HIST-0035: material actions and the corpus index retain accessible server fallbacks', async () => {
	const site = await createCompiledSiteDriver();
	const [articleResponse, indexResponse, favicon] = await Promise.all([
		site.request('/en/programming/why-documentation-matters'),
		site.request('/en/pages/corpus-index'),
		readFile(new URL('../../public/favicon.svg', import.meta.url), 'utf8'),
	]);
	assert.equal(articleResponse.status, 200);
	assert.equal(indexResponse.status, 200);

	const article = await articleResponse.text();
	assert.match(article, /id="article-actions"/);
	assert.match(article, /href="#companion"/);
	assert.match(article, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.20608558"/);
	const index = await indexResponse.text();
	assert.match(index, /corpus-index-page/);
	assert.match(index, /class="entity-index"/);
	assert.match(favicon, /M64 9\.1L67\.7 21\.5/);
});
