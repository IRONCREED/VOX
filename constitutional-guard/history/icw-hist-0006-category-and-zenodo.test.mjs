import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0006: categories navigate and linked publications remain external', async () => {
	const site = await createCompiledSiteDriver();

	const home = await site.request('/uk/');
	assert.equal(home.status, 200);
	const homeHtml = await home.text();
	assert.match(homeHtml, /href=["']\/uk\/documentation["']/);
	assert.match(homeHtml, /class=["']theme-switcher["']/);

	const category = await site.request('/uk/documentation');
	assert.equal(category.status, 200);
	const categoryHtml = await category.text();
	assert.match(categoryHtml, /Навіщо потрібна документація/);
	assert.doesNotMatch(categoryHtml, /Конституція коду/);

	const article = await site.request('/uk/documentation/navishcho-potribna-dokumentatsiia');
	assert.equal(article.status, 200);
	const articleHtml = await article.text();
	assert.match(articleHtml, /https:\/\/zenodo\.org\/records\/20608559/);
	assert.match(articleHtml, /10\.5281\/zenodo\.20608559/);
	assert.match(articleHtml, /id=["']zenodo-publication["']/);
	assert.match(articleHtml, /Матеріал на сайті/);
	assert.doesNotMatch(articleHtml, /class=["'][^"']*\bcompanion-signal\b/);
});
