import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0003: locale routes expose server HTML, canonical, and hreflang', async () => {
	const site = await createCompiledSiteDriver();
	const redirect = await site.request('/');
	assert.equal(redirect.status, 308);
	assert.equal(new URL(redirect.headers.get('location')).pathname, '/uk/');

	const ukrainian = await site.request('/uk/');
	assert.equal(ukrainian.status, 200);
	const ukrainianHtml = await ukrainian.text();
	assert.match(ukrainianHtml, /<html[^>]*\blang=["']uk["']/i);
	assert.match(ukrainianHtml, /Система, що пам/);
	assert.match(ukrainianHtml, /rel=["']canonical["']/i);
	assert.match(ukrainianHtml, /hreflang=["']en["']/i);
	assert.doesNotMatch(ukrainianHtml, /\bNOIR\b/i);

	const english = await site.request('/en/');
	assert.equal(english.status, 200);
	const englishHtml = await english.text();
	assert.match(englishHtml, /<html[^>]*\blang=["']en["']/i);
	assert.match(englishHtml, /A system that remembers its own intent/);

	const article = await site.request('/uk/documentation/navishcho-potribna-dokumentatsiia');
	assert.equal(article.status, 200);
	const articleHtml = await article.text();
	assert.match(articleHtml, /Навіщо потрібна документація/);
	assert.match(articleHtml, /Пам.{0,4}ять як інфраструктура/);
	assert.match(articleHtml, /application\/ld\+json/i);
});
