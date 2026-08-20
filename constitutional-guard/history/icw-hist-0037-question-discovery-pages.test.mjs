import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0037: every public question has one localized index URL and associated sources', async () => {
	const site = await createCompiledSiteDriver();
	const [question, ukQuestions, enQuestions] = await Promise.all([
		site.request('/en/questions/q.ada.why-not-stop-sir'),
		site.request('/sitemaps/uk/questions.xml'),
		site.request('/sitemaps/en/questions.xml'),
	]);

	assert.equal(question.status, 200);
	const html = await question.text();
	assert.match(html, /data-selected-entity="q\.ada\.why-not-stop-sir"/);
	assert.match(html, /data-selected="true"/);
	assert.match(html, /Materials under this question/);
	assert.match(html, /Do Not Be Afraid, Sir/);
	assert.match(html, /application\/ld\+json/);
	assert.match(html, /"@type":"QAPage"/);

	for (const response of [ukQuestions, enQuestions]) assert.equal(response.status, 200);
	const ukXml = await ukQuestions.text();
	const enXml = await enQuestions.text();
	assert.equal((ukXml.match(/<url>/g) ?? []).length, 455);
	assert.equal((enXml.match(/<url>/g) ?? []).length, 455);
	assert.match(ukXml, /\/uk\/questions\/q\.ada\.why-not-stop-sir/);
	assert.match(enXml, /\/en\/questions\/q\.ada\.why-not-stop-sir/);
	assert.doesNotMatch(`${ukXml}${enXml}`, /\?question=/);
});

test('ICW-HIST-0037: one public index points to exactly four localized maps', async () => {
	const site = await createCompiledSiteDriver();
	const [root, ukSite, enSite, robots] = await Promise.all([
		site.request('/sitemap.xml'),
		site.request('/sitemaps/uk/site.xml'),
		site.request('/sitemaps/en/site.xml'),
		site.request('/robots.txt'),
	]);

	assert.equal(root.status, 200);
	const rootXml = await root.text();
	assert.equal((rootXml.match(/<sitemap>/g) ?? []).length, 4);
	for (const path of [
		'/sitemaps/uk/site.xml',
		'/sitemaps/uk/questions.xml',
		'/sitemaps/en/site.xml',
		'/sitemaps/en/questions.xml',
	]) {
		assert.match(rootXml, new RegExp(path.replaceAll('/', '\\/')));
	}
	assert.equal(ukSite.status, 200);
	assert.equal(enSite.status, 200);
	assert.equal(((await ukSite.text()).match(/<url>/g) ?? []).length, 23);
	assert.equal(((await enSite.text()).match(/<url>/g) ?? []).length, 23);
	assert.match(await robots.text(), /Sitemap:.*\/sitemap\.xml/i);
});

test('ICW-HIST-0037: new materials lead the home while both research series remain layered', async () => {
	const site = await createCompiledSiteDriver();
	const [enHome, ukHome, enResearch, ukResearch] = await Promise.all([
		site.request('/en/'),
		site.request('/uk/'),
		site.request('/en/research'),
		site.request('/uk/research'),
	]);
	for (const response of [enHome, ukHome, enResearch, ukResearch]) {
		assert.equal(response.status, 200);
	}
	const enHomeHtml = (await enHome.text()).replaceAll('<!-- -->', '');
	const ukHomeHtml = (await ukHome.text()).replaceAll('<!-- -->', '');
	assert.match(enHomeHtml, /Do Not Be Afraid, Sir/);
	assert.match(enHomeHtml, /Research · Material series · 1/);
	assert.match(ukHomeHtml, /Не бійтеся, сер/);
	assert.match(ukHomeHtml, /Дослідження · Серія матеріалів · 1/);

	for (const html of [await enResearch.text(), await ukResearch.text()]) {
		assert.equal((html.match(/data-catalog-id="series\./g) ?? []).length, 2);
		const back = html.indexOf('protocol-folder__back');
		const firstSheet = html.indexOf('protocol-folder__sheet--1');
		const document = html.indexOf('protocol-folder__document');
		assert.ok(back >= 0 && firstSheet > back && document > firstSheet);
	}
});

test('ICW-HIST-0037: the enlarged mark, quiet sidebar glyph, and favicon plate survive compilation', async () => {
	const site = await createCompiledSiteDriver();
	const [home, favicon] = await Promise.all([
		site.request('/en/'),
		readFile(new URL('../../public/favicon.svg', import.meta.url), 'utf8'),
	]);
	assert.equal(home.status, 200);
	const html = await home.text();
	assert.match(html, /class="brand-mark brand-mark--header"/);
	assert.match(html, /class="sidebar-toggle__glyph"/);
	assert.doesNotMatch(html, /sidebar-toggle__glyph"[^>]*>\s*<i/);
	assert.match(favicon, /iron-creed-favicon__plate/);
	assert.match(favicon, /viewBox="0 0 128 128"/);
});
