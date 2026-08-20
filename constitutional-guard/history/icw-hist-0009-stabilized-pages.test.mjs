import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0009: addressable pages and no-JavaScript fallbacks remain complete', async () => {
	const site = await createCompiledSiteDriver();

	const firstPage = await site.request('/uk/?page=1');
	const secondPage = await site.request('/uk/?page=2');
	assert.equal(firstPage.status, 200);
	assert.equal(secondPage.status, 200);
	const firstHtml = await firstPage.text();
	const secondHtml = await secondPage.text();

	assert.match(firstHtml, /Історичний корпус тестів/);
	assert.doesNotMatch(secondHtml, /Історичний корпус тестів/);
	assert.match(secondHtml, /Як читати систему/);
	assert.match(secondHtml, /Архітектура і час/);
	assert.match(firstHtml, /class=["'][^"']*load-more[^"']*["'][\s\S]*?(?:→|&rarr;|&#x2192;)/);

	const category = await site.request('/uk/protocols');
	assert.equal(category.status, 200);
	const categoryHtml = await category.text();
	assert.match(categoryHtml, /Повторювані процедури, що перетворюють принцип на дію/);

	const localArticle = await site.request('/uk/protocols/istorychnyi-korpus-testiv');
	assert.equal(localArticle.status, 200);
	const localArticleHtml = await localArticle.text();
	assert.match(localArticleHtml, /ІІ-компаньйону потрібен JavaScript/);
	assert.match(
		localArticleHtml,
		/Кожна виправлена помилка залишається кордоном для наступної зміни/,
	);
	assert.doesNotMatch(localArticleHtml, /class=["'][^"']*suggestion-list/);
	assert.doesNotMatch(localArticleHtml, /https:\/\/zenodo\.org\/records\//);

	const publishedArticle = await site.request(
		'/uk/documentation/navishcho-potribna-dokumentatsiia',
	);
	assert.equal(publishedArticle.status, 200);
	const publishedArticleHtml = await publishedArticle.text();
	assert.match(publishedArticleHtml, /https:\/\/zenodo\.org\/records\/20608559/);
	assert.match(
		publishedArticleHtml,
		/Документ зберігає рішення після того, як зникає голос автора/,
	);
});
