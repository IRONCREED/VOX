import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

const diagramCount = (html) => (html.match(/class="ic-diagram"/g) ?? []).length;

test('ICW-HIST-0047: both About locales expose one concise identity, a portfolio, profiles, and direct contact', async () => {
	const site = await createCompiledSiteDriver();
	const [ukResponse, enResponse, indexResponse] = await Promise.all([
		site.request('/uk/pages/about'),
		site.request('/en/pages/about'),
		site.request('/en/pages/corpus-index'),
	]);
	for (const response of [ukResponse, enResponse, indexResponse])
		assert.equal(response.status, 200);

	const uk = await ukResponse.text();
	const en = await enResponse.text();
	const index = await indexResponse.text();
	assert.match(uk, /Хто такий IRON CREED\?/);
	assert.match(uk, /EMBO Studio · довгострокова інфраструктурна підтримка/);
	assert.match(en, /Who is IRON CREED\?/);
	assert.match(en, /IRON CREED — the engineering practice of Zhovten Games/);
	assert.match(en, /EMBO Studio · long-term infrastructure support/);
	assert.match(en, /Shifton, Zipy, and 200\+ high-density cases/);
	assert.match(en, /Public team profiles/);
	assert.match(en, /href="https:\/\/www\.linkedin\.com\/company\/IRONCREED"/);
	assert.doesNotMatch(en, /Project type|Problem description/);
	assert.match(index, /concept\.iron-creed/);
	assert.match(index, />579<\/small>/);
});

test('ICW-HIST-0047: all materialized diagram families remain present after the About release', async () => {
	const site = await createCompiledSiteDriver();
	const [documentation, body, articleOne] = await Promise.all([
		site.request('/en/programming/why-documentation-matters'),
		site.request('/en/research/from-body-to-signal'),
		site.request('/en/research/write-america-how-article-i-turns-intent-into-general-law'),
	]);
	for (const response of [documentation, body, articleOne]) assert.equal(response.status, 200);
	assert.equal(diagramCount(await documentation.text()), 4);
	assert.equal(diagramCount(await body.text()), 6);
	const articleOneHtml = await articleOne.text();
	assert.equal(diagramCount(articleOneHtml), 8);
	assert.match(articleOneHtml, /role="table"/);
});
