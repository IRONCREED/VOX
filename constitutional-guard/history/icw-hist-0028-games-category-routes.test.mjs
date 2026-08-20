import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0028: games is absent from navigation, routes, and the material API', async () => {
	const site = await createCompiledSiteDriver();
	const [ukHome, enHome, ukGames, enGames, gamesApi] = await Promise.all([
		site.request('/uk/'),
		site.request('/en/'),
		site.request('/uk/games'),
		site.request('/en/games'),
		site.request('/api/materials?locale=en&category=games&page=1'),
	]);

	assert.equal(ukHome.status, 200);
	assert.equal(enHome.status, 200);
	assert.doesNotMatch(await ukHome.text(), /href=["']\/uk\/games["']/);
	assert.doesNotMatch(await enHome.text(), /href=["']\/en\/games["']/);
	assert.equal(ukGames.status, 404);
	assert.equal(enGames.status, 404);
	assert.equal(gamesApi.status, 400);
	assert.deepEqual(await gamesApi.json(), { error: 'Unsupported category.' });
});

test('ICW-HIST-0028: the three remaining categories preserve their public behavior', async () => {
	const site = await createCompiledSiteDriver();
	const [programming, research, scenarios, api] = await Promise.all([
		site.request('/en/programming'),
		site.request('/en/research'),
		site.request('/en/scenarios'),
		site.request('/api/materials?locale=en&page=1'),
	]);

	for (const response of [programming, research, scenarios, api]) {
		assert.equal(response.status, 200);
	}
	assert.match(await programming.text(), /Why Documentation Matters/);
	assert.match(await research.text(), /From Body to Signal/);
	assert.doesNotMatch(await scenarios.text(), /class=["'][^"']*material-card/);
	const payload = await api.json();
	assert.deepEqual(
		new Set(payload.items.map((item) => item.category)),
		new Set(['programming', 'research']),
	);
});

test('ICW-HIST-0028: the 0.12.0 content pages and publication metadata remain public', async () => {
	const site = await createCompiledSiteDriver();
	const [about, index, licensing, research, programming, sitemap, robots] = await Promise.all([
		site.request('/en/pages/about'),
		site.request('/en/pages/corpus-index'),
		site.request('/en/pages/licensing'),
		site.request('/en/research/from-body-to-signal'),
		site.request('/en/programming/why-documentation-matters'),
		site.request('/sitemap.xml'),
		site.request('/robots.txt'),
	]);

	for (const response of [about, index, licensing, research, programming, robots]) {
		assert.equal(response.status, 200);
	}
	assert.match(await about.text(), /military medical-AI prototype/);
	assert.match(await index.text(), />118<\/small>/);
	assert.match(await licensing.text(), /CC BY-SA 4\.0/);
	const researchHtml = await research.text();
	const programmingHtml = await programming.text();
	assert.match(researchHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.19773963"/);
	assert.match(programmingHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.20608558"/);
	assert.match(researchHtml, /href="https:\/\/orcid\.org\/0009-0009-2621-6372"/);
	assert.equal(sitemap.status, 404);
	assert.doesNotMatch(await robots.text(), /sitemap/i);
});
