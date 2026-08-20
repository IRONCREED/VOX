import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

const withoutReactMarkers = (html) => html.replaceAll('<!-- -->', '');

test('ICW-HIST-0033: the release presents category-aware correctly layered series', async () => {
	const site = await createCompiledSiteDriver();
	const [enHome, ukHome] = await Promise.all([site.request('/en/'), site.request('/uk/')]);
	assert.equal(enHome.status, 200);
	assert.equal(ukHome.status, 200);

	const enHtml = withoutReactMarkers(await enHome.text());
	const ukHtml = withoutReactMarkers(await ukHome.text());
	assert.match(enHtml, /Objective established: live/);
	assert.match(ukHtml, /Завдання встановлено: жити/);
	assert.match(enHtml, /Research · Material series · 7/);
	assert.match(ukHtml, /Дослідження · Серія матеріалів · 7/);

	const back = enHtml.indexOf('protocol-folder__back');
	const firstSheet = enHtml.indexOf('protocol-folder__sheet--1');
	const document = enHtml.indexOf('protocol-folder__document');
	assert.ok(back >= 0 && firstSheet > back && document > firstSheet);
});

test('ICW-HIST-0033: non-JavaScript HTML has quip text without an inert switch', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/');
	assert.equal(response.status, 200);
	const html = await response.text();
	assert.match(html, /Lady Hague/);
	assert.doesNotMatch(html, /aria-label="Next line"/);
});

test('ICW-HIST-0033: the corpus index omits the page directory and licensing discloses VOX', async () => {
	const site = await createCompiledSiteDriver();
	const [index, licensing] = await Promise.all([
		site.request('/en/pages/corpus-index'),
		site.request('/en/pages/licensing'),
	]);
	assert.equal(index.status, 200);
	assert.equal(licensing.status, 200);
	const indexHtml = await index.text();
	assert.doesNotMatch(indexHtml, /page-directory/);
	assert.match(indexHtml, /value="page"/);
	const licensingHtml = await licensing.text();
	assert.match(licensingHtml, /Every production deployment/);
	assert.match(licensingHtml, /VOX-PUBLICATION\.json/);
});
