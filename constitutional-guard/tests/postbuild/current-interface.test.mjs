import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

const withoutReactMarkers = (html) => html.replaceAll('<!-- -->', '');

test('material API clamps an exhausted page to the addressable catalog', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/api/materials?locale=uk&page=99');

	assert.equal(response.status, 200);
	const payload = await response.json();
	assert.equal(payload.page, 2);
	assert.equal(payload.pageSize, 2);
	assert.equal(payload.totalItems, 3);
	assert.equal(payload.totalPages, 2);
	assert.equal(payload.items.length, 1);
	assert.ok(payload.items.every((item) => item.href.startsWith('/uk/')));
});

test('the retired games category has no navigation, route, or API filter', async () => {
	const site = await createCompiledSiteDriver();
	const [ukHome, enHome, ukRoute, enRoute, api] = await Promise.all([
		site.request('/uk/'),
		site.request('/en/'),
		site.request('/uk/games'),
		site.request('/en/games'),
		site.request('/api/materials?locale=en&category=games&page=1'),
	]);

	assert.doesNotMatch(await ukHome.text(), /href=["']\/uk\/games["']/);
	assert.doesNotMatch(await enHome.text(), /href=["']\/en\/games["']/);
	assert.equal(ukRoute.status, 404);
	assert.equal(enRoute.status, 404);
	assert.equal(api.status, 400);
});

test('one stable tag filters both the server page and progressive endpoint', async () => {
	const site = await createCompiledSiteDriver();
	const [pageResponse, apiResponse, invalidResponse] = await Promise.all([
		site.request('/uk/research?tag=war'),
		site.request('/api/materials?locale=uk&category=research&tag=war&page=1'),
		site.request('/api/materials?locale=uk&tag=unknown-tag&page=1'),
	]);

	assert.equal(pageResponse.status, 200);
	const html = await pageResponse.text();
	assert.match(html, /aria-label="Відібрати за тегом"/);
	assert.match(html, /href="\/uk\/research\?tag=war"[^>]*aria-current="page"/);
	assert.match(html, /Від тіла до сигналу/);

	assert.equal(apiResponse.status, 200);
	const payload = await apiResponse.json();
	assert.equal(payload.totalItems, 1);
	assert.equal(payload.items.length, 1);
	assert.ok(payload.items[0].tags.includes('war'));

	assert.equal(invalidResponse.status, 400);
});

test('one material series replaces its seven parts in catalog listings', async () => {
	const site = await createCompiledSiteDriver();
	const [homeResponse, researchResponse, apiResponse, seriesResponse] = await Promise.all([
		site.request('/en/'),
		site.request('/en/research'),
		site.request('/api/materials?locale=en&category=research&page=1'),
		site.request('/en/series/the-constitution-that-runs'),
	]);

	for (const response of [homeResponse, researchResponse, apiResponse, seriesResponse]) {
		assert.equal(response.status, 200);
	}

	const homeHtml = await homeResponse.text();
	assert.match(homeHtml, /href="\/en\/series\/the-constitution-that-runs"/);
	assert.match(homeHtml, /material-card--series/);
	assert.match(homeHtml, /protocol-folder__back/);
	assert.match(homeHtml, /protocol-folder__sheet--1/);
	assert.match(homeHtml, /protocol-folder__sheet--2/);
	assert.match(withoutReactMarkers(homeHtml), /Research · Material series · 7/);
	assert.match(homeHtml, /Write America: How Article I Turns Intent into General Law/);

	const researchHtml = await researchResponse.text();
	assert.equal((researchHtml.match(/data-catalog-id=/g) ?? []).length, 2);
	assert.equal(
		(researchHtml.match(/data-catalog-id="series\.constitution-runtime"/g) ?? []).length,
		1,
	);
	assert.doesNotMatch(
		researchHtml,
		/data-catalog-id="material\.constitution-runtime-01-article-vii"/,
	);

	const payload = await apiResponse.json();
	assert.equal(payload.totalItems, 2);
	assert.equal(payload.items.filter((item) => item.kind === 'series').length, 1);
	assert.equal(payload.items.find((item) => item.kind === 'series')?.partCount, 7);

	const seriesHtml = await seriesResponse.text();
	assert.match(seriesHtml, /The Constitution That Runs/);
	assert.match(seriesHtml, /Connect America: How Article VII Bootstraps a Republic/);
	assert.match(seriesHtml, /Write America: How Article I Turns Intent into General Law/);
	assert.equal(
		(seriesHtml.match(/data-catalog-id="material\.constitution-runtime-/g) ?? []).length,
		7,
	);
});

test('series parts expose membership, permanent DOI, authors, and previous-next navigation', async () => {
	const site = await createCompiledSiteDriver();
	const [firstResponse, middleResponse, lastResponse] = await Promise.all([
		site.request('/en/research/connect-america-how-article-vii-bootstraps-a-republic'),
		site.request('/en/research/update-america-how-article-v-changes-the-constitutional-kernel'),
		site.request('/en/research/write-america-how-article-i-turns-intent-into-general-law'),
	]);

	for (const response of [firstResponse, middleResponse, lastResponse]) {
		assert.equal(response.status, 200);
	}

	const firstHtml = withoutReactMarkers(await firstResponse.text());
	assert.match(firstHtml, /The Constitution That Runs/);
	assert.match(firstHtml, />1\/7</);
	assert.match(
		firstHtml,
		/href="\/en\/research\/what-america-trusts-how-article-vi-assembles-the-supreme-order"[^>]*rel="next"/,
	);
	assert.match(firstHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.21894242"/);
	assert.match(firstHtml, /href="https:\/\/orcid\.org\/0009-0009-2621-6372"/);
	assert.match(firstHtml, /href="https:\/\/orcid\.org\/0009-0003-8777-8412"/);

	const middleHtml = withoutReactMarkers(await middleResponse.text());
	assert.match(middleHtml, />3\/7</);
	assert.match(middleHtml, /rel="prev"/);
	assert.match(middleHtml, /rel="next"/);

	const lastHtml = withoutReactMarkers(await lastResponse.text());
	assert.match(lastHtml, />7\/7</);
	assert.match(lastHtml, /rel="prev"/);
	assert.doesNotMatch(lastHtml, /rel="next"/);
});

test('the programming post is addressable and filterable by its stable tag', async () => {
	const site = await createCompiledSiteDriver();
	const [categoryResponse, articleResponse, apiResponse] = await Promise.all([
		site.request('/en/programming?tag=documentation'),
		site.request('/en/programming/why-documentation-matters'),
		site.request('/api/materials?locale=en&category=programming&tag=documentation&page=1'),
	]);

	assert.equal(categoryResponse.status, 200);
	assert.match(await categoryResponse.text(), /Why Documentation Matters/);

	assert.equal(articleResponse.status, 200);
	const articleHtml = await articleResponse.text();
	assert.match(articleHtml, /How a Decision Outlives Its Author/);
	assert.match(articleHtml, /<pre[^>]*data-language="ts"[^>]*><code>/);
	assert.match(articleHtml, /10\.5281\/zenodo\.20608558/);

	assert.equal(apiResponse.status, 200);
	const payload = await apiResponse.json();
	assert.equal(payload.totalItems, 1);
	assert.equal(payload.items.length, 1);
	assert.ok(payload.items[0].tags.includes('documentation'));
});

test('the complete entity index has its own localized content page', async () => {
	const site = await createCompiledSiteDriver();
	const [ukHomeResponse, ukResponse, enResponse, deepQuestionResponse] = await Promise.all([
		site.request('/uk/'),
		site.request('/uk/pages/corpus-index'),
		site.request('/en/pages/corpus-index'),
		site.request('/en/research/from-body-to-signal?question=q.channel-centrality#companion'),
	]);
	assert.equal(ukHomeResponse.status, 200);
	const ukHomeHtml = await ukHomeResponse.text();
	assert.match(ukHomeHtml, /href="\/uk\/pages\/corpus-index"/);
	assert.doesNotMatch(ukHomeHtml, /aria-label="Тип сутності"/);
	assert.equal(ukResponse.status, 200);
	const ukHtml = await ukResponse.text();
	assert.match(ukHtml, /Індекс корпусу/);
	assert.match(ukHtml, /aria-label="Тип сутності"/);
	assert.match(ukHtml, /value="question"/);
	assert.match(ukHtml, />545<\/small>/);
	assert.match(ukHtml, /value="page"/);

	assert.equal(enResponse.status, 200);
	const enHtml = await enResponse.text();
	assert.match(enHtml, /Corpus index/);
	assert.match(enHtml, /All kinds/);
	assert.match(enHtml, /q\.documentation\.documentation-memory/);
	assert.match(enHtml, /page\.about/);
	assert.doesNotMatch(enHtml, /Ordinary mode/);
	assert.doesNotMatch(enHtml, /page-directory/);

	assert.equal(deepQuestionResponse.status, 200);
	assert.match(await deepQuestionResponse.text(), /AI companion/);
});

test('the build, about page, policies, and human-readable discovery are public', async () => {
	const site = await createCompiledSiteDriver();
	const [home, about, licensing, privacy, robots, sitemap] = await Promise.all([
		site.request('/en/'),
		site.request('/en/pages/about'),
		site.request('/en/pages/licensing'),
		site.request('/en/pages/privacy-policy'),
		site.request('/robots.txt'),
		site.request('/sitemap.xml'),
	]);

	assert.equal(home.status, 200);
	const homeHtml = await home.text();
	assert.match(homeHtml, /Objective established: live/);
	assert.match(homeHtml, /href="https:\/\/github\.com\/IRONCREED\/VOX"/);
	assert.match(homeHtml, /Lady Hague/);
	assert.doesNotMatch(homeHtml, /aria-label="Next line"/);
	assert.match(homeHtml, /href="\/en\/pages\/about"/);

	assert.equal(about.status, 200);
	const aboutHtml = await about.text();
	assert.match(aboutHtml, /military medical-AI prototype/);
	assert.match(aboutHtml, /OpenAI GPT/);
	assert.match(aboutHtml, /https:\/\/interdead\.phantom-draft\.com\//);
	assert.match(aboutHtml, /AI companion/);

	for (const response of [licensing, privacy]) assert.equal(response.status, 200);
	const licensingHtml = await licensing.text();
	for (const slug of ['terms-of-use', 'privacy-policy', 'ai-policy', 'licensing']) {
		assert.match(licensingHtml, new RegExp(`href="/en/pages/${slug}"`));
	}
	assert.match(licensingHtml, /<table>/);
	assert.match(licensingHtml, /CC BY-SA 4\.0/);
	assert.match(licensingHtml, /Every production deployment/);
	assert.match(licensingHtml, /VOX-PUBLICATION\.json/);

	assert.equal(robots.status, 200);
	assert.doesNotMatch(await robots.text(), /sitemap/i);
	assert.equal(sitemap.status, 404);
});

test('publication metadata uses permanent DOI and linked ORCID authors', async () => {
	const site = await createCompiledSiteDriver();
	const [research, programming] = await Promise.all([
		site.request('/en/research/from-body-to-signal'),
		site.request('/en/programming/why-documentation-matters'),
	]);
	const researchHtml = await research.text();
	const programmingHtml = await programming.text();

	assert.match(researchHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.19773963"/);
	assert.match(programmingHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.20608558"/);
	for (const html of [researchHtml, programmingHtml]) {
		assert.match(html, /href="https:\/\/orcid\.org\/0009-0009-2621-6372"/);
		assert.match(html, /href="https:\/\/orcid\.org\/0009-0003-8777-8412"/);
	}
	assert.match(
		researchHtml,
		/<em>Language as Infection: Media Communication as a Mechanism of Harm<\/em>/,
	);
});
