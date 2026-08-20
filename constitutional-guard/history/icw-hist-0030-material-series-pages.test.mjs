import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

const withoutReactMarkers = (html) => html.replaceAll('<!-- -->', '');

test('ICW-HIST-0030: one series card replaces seven part cards in public listings', async () => {
	const site = await createCompiledSiteDriver();
	const [home, research, api, games] = await Promise.all([
		site.request('/en/'),
		site.request('/en/research'),
		site.request('/api/materials?locale=en&category=research&page=1'),
		site.request('/en/games'),
	]);

	for (const response of [home, research, api]) assert.equal(response.status, 200);
	assert.equal(games.status, 404);

	const homeHtml = await home.text();
	assert.match(homeHtml, /href="\/en\/series\/the-constitution-that-runs"/);
	assert.match(homeHtml, /material-card--series/);
	assert.match(homeHtml, /protocol-folder__sheet--1/);
	assert.match(homeHtml, /protocol-folder__sheet--2/);

	const researchHtml = await research.text();
	assert.equal((researchHtml.match(/data-catalog-id=/g) ?? []).length, 2);
	assert.equal(
		(researchHtml.match(/data-catalog-id="series\.constitution-runtime"/g) ?? []).length,
		1,
	);
	assert.doesNotMatch(researchHtml, /data-catalog-id="material\.constitution-runtime-/);

	const payload = await api.json();
	assert.equal(payload.totalItems, 2);
	assert.equal(payload.items.filter((item) => item.kind === 'series').length, 1);
	assert.equal(payload.items.find((item) => item.kind === 'series')?.partCount, 7);
});

test('ICW-HIST-0030: the series page lists seven ordered parts', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/series/the-constitution-that-runs');
	assert.equal(response.status, 200);
	const html = await response.text();

	assert.match(html, /The Constitution That Runs/);
	assert.match(html, /Connect America: How Article VII Bootstraps a Republic/);
	assert.match(html, /Write America: How Article I Turns Intent into General Law/);
	assert.equal((html.match(/data-catalog-id="material\.constitution-runtime-/g) ?? []).length, 7);
});

test('ICW-HIST-0030: parts expose series navigation, DOI, ORCID, and the expanded index', async () => {
	const site = await createCompiledSiteDriver();
	const [first, middle, last, index, gamesApi] = await Promise.all([
		site.request('/en/research/connect-america-how-article-vii-bootstraps-a-republic'),
		site.request('/en/research/update-america-how-article-v-changes-the-constitutional-kernel'),
		site.request('/en/research/write-america-how-article-i-turns-intent-into-general-law'),
		site.request('/en/pages/corpus-index'),
		site.request('/api/materials?locale=en&category=games&page=1'),
	]);

	for (const response of [first, middle, last, index]) assert.equal(response.status, 200);
	assert.equal(gamesApi.status, 400);

	const firstHtml = withoutReactMarkers(await first.text());
	assert.match(firstHtml, />1\/7</);
	assert.match(firstHtml, /rel="next"/);
	assert.match(firstHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.21894242"/);
	assert.match(firstHtml, /href="https:\/\/orcid\.org\/0009-0009-2621-6372"/);
	assert.match(firstHtml, /href="https:\/\/orcid\.org\/0009-0003-8777-8412"/);

	const middleHtml = withoutReactMarkers(await middle.text());
	assert.match(middleHtml, />3\/7</);
	assert.match(middleHtml, /rel="prev"/);
	assert.match(middleHtml, /rel="next"/);

	const lastHtml = withoutReactMarkers(await last.text());
	assert.match(lastHtml, />7\/7</);
	assert.match(lastHtml, /rel="prev"/);
	assert.doesNotMatch(lastHtml, /rel="next"/);

	const indexHtml = await index.text();
	assert.match(indexHtml, />545<\/small>/);
	assert.match(indexHtml, /value="series"/);
});
